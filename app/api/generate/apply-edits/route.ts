import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { buildStyleEditPrompt, buildAnnotationPrompt } from "@/lib/explore/style-to-code";
import { checkQuota, deductCredit } from "@/lib/billing/credits";
import { logUsage } from "@/lib/billing/usage";
import { generateLimiter } from "@/lib/rate-limit-instances";
import { getClientIp } from "@/lib/get-client-ip";
import { logApiCall } from "@/lib/logging/api-log";
import type { StyleEdit, ElementAnnotation } from "@/lib/types";
import type { AiMode } from "@/lib/types/billing";

const StyleEditSchema = z.object({
  elementId: z.string(),
  elementTag: z.string(),
  elementClasses: z.string(),
  property: z.string(),
  before: z.string(),
  after: z.string(),
  tokenMatch: z.string().optional(),
});

const AnnotationSchema = z.object({
  elementId: z.string(),
  elementTag: z.string(),
  note: z.string(),
  rect: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }),
});

const RequestSchema = z.object({
  code: z.string().min(1).max(200_000),
  layoutMd: z.string().optional(),
  styleEdits: z.array(StyleEditSchema).optional(),
  annotations: z.array(AnnotationSchema).optional(),
});

export async function POST(request: NextRequest) {
  const ip = await getClientIp();
  const { success } = generateLimiter.check(20, ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const userId = session.user.id;
  const userApiKey = request.headers.get("X-Api-Key") || undefined;

  let mode: AiMode;
  let apiKey: string | undefined;

  if (userApiKey && userApiKey.startsWith("sk-ant-")) {
    mode = "byok";
    apiKey = userApiKey;
  } else {
    const quota = await checkQuota(userId, "test");
    if (!quota.allowed) {
      return Response.json(
        { error: quota.reason, code: "QUOTA_EXCEEDED", remaining: quota.remaining },
        { status: 402 }
      );
    }

    const deducted = await deductCredit(userId, "test");
    if (!deducted) {
      return Response.json(
        { error: "No credits remaining. Top up or use your own API key.", code: "QUOTA_EXCEEDED" },
        { status: 402 }
      );
    }

    mode = "hosted";
    apiKey = process.env.ANTHROPIC_API_KEY;
  }

  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  const { code, layoutMd, styleEdits, annotations } = parsed.data;
  const startTime = Date.now();

  if (!styleEdits?.length && !annotations?.length) {
    return Response.json({ error: "No edits or annotations provided" }, { status: 400 });
  }

  const prompt = styleEdits?.length
    ? buildStyleEditPrompt(code, styleEdits as StyleEdit[], layoutMd)
    : buildAnnotationPrompt(code, annotations as ElementAnnotation[], layoutMd);

  const client = new Anthropic({ apiKey, timeout: 90_000 });

  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 32_000,
      messages: [{ role: "user", content: prompt }],
    });
  } catch (err) {
    console.error("[apply-edits] Anthropic API error:", err);
    const message = err instanceof Error ? err.message : "Code generation failed";
    const isTimeout = message.includes("timeout") || message.includes("aborted");
    const statusCode = isTimeout ? 504 : 502;
    void logApiCall({ userId, endpoint: "generate/apply-edits", statusCode, durationMs: Date.now() - startTime, errorMessage: message, metadata: { editCount: styleEdits?.length ?? 0, annotationCount: annotations?.length ?? 0 } });
    return Response.json(
      { error: isTimeout ? "Request timed out. Try a smaller change or try again." : message },
      { status: statusCode },
    );
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Extract code from markdown fence if present
  const fenceMatch = text.match(/```(?:tsx?|jsx?|react)?\n([\s\S]*?)```/);
  const updatedCode = fenceMatch ? fenceMatch[1].trim() : text.trim();

  if (!updatedCode) {
    return Response.json({ error: "No code returned from AI. Try again." }, { status: 502 });
  }

  void logApiCall({ userId, endpoint: "generate/apply-edits", statusCode: 200, durationMs: Date.now() - startTime, metadata: { editCount: styleEdits?.length ?? 0, annotationCount: annotations?.length ?? 0 } });
  void logUsage({
    userId,
    endpoint: "test",
    mode,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    model: "claude-sonnet-4-6",
  }).catch((err) => console.error("Usage logging failed:", err));

  return Response.json({ code: updatedCode });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createEditStream } from "@/lib/claude/edit";
import { auth } from "@/lib/auth";
import { checkQuota, deductCredit, refundCredit } from "@/lib/billing/credits";
import { logUsage } from "@/lib/billing/usage";
import { generateLimiter } from "@/lib/rate-limit-instances";
import { getClientIp } from "@/lib/get-client-ip";
import { registerStream, deregisterStream, isShuttingDown } from "@/lib/server/active-streams";
import { logApiCall } from "@/lib/logging/api-log";
import type { AiMode } from "@/lib/types/billing";

const RequestSchema = z.object({
  instruction: z.string().min(1),
  layoutMd: z.string().min(1),
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

  if (isShuttingDown()) {
    return NextResponse.json(
      { error: "Server is restarting. Please retry in a few seconds." },
      { status: 503, headers: { "Retry-After": "10" } }
    );
  }

  const userId = session.user.id;
  const userApiKey = request.headers.get("X-Api-Key") || undefined;

  let mode: AiMode;
  let apiKey: string | undefined;

  if (userApiKey && userApiKey.startsWith("sk-ant-")) {
    mode = "byok";
    apiKey = userApiKey;
  } else {
    const quota = await checkQuota(userId, "edit");
    if (!quota.allowed) {
      return Response.json(
        { error: quota.reason, code: "QUOTA_EXCEEDED", remaining: quota.remaining },
        { status: 402 }
      );
    }

    const deducted = await deductCredit(userId, "edit");
    if (!deducted) {
      return Response.json(
        { error: "No credits remaining. Top up or use your own API key.", code: "QUOTA_EXCEEDED" },
        { status: 402 }
      );
    }

    mode = "hosted";
    apiKey = process.env.ANTHROPIC_API_KEY;
  }

  const { instruction, layoutMd } = parsed.data;
  const streamController = registerStream();
  const startTime = Date.now();
  const { stream, usage } = createEditStream(instruction, layoutMd, apiKey);

  void usage
    .then((u) => {
      void logApiCall({ userId, endpoint: "generate/edit-layout-md", statusCode: 200, durationMs: Date.now() - startTime, metadata: { instructionLength: instruction.length } });
      return logUsage({
        userId,
        endpoint: "edit",
        mode,
        usage: u,
        model: "claude-sonnet-4-6",
      });
    })
    .catch(async (err) => {
      console.error("Stream failed, refunding credit:", err);
      void logApiCall({ userId, endpoint: "generate/edit-layout-md", statusCode: 500, durationMs: Date.now() - startTime, errorMessage: err instanceof Error ? err.message : String(err) });
      if (mode === "hosted") {
        await refundCredit(userId, "edit");
      }
    })
    .finally(() => {
      deregisterStream(streamController);
    });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}

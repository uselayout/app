import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { createExploreStream, createRefineStream } from "@/lib/claude/explore";
import { auth } from "@/lib/auth";
import { checkQuota, deductCredit } from "@/lib/billing/credits";
import { logUsage } from "@/lib/billing/usage";
import type { AiMode } from "@/lib/types/billing";

const RequestSchema = z.object({
  prompt: z.string().min(1),
  designMd: z.string(),
  variantCount: z.number().int().min(1).max(6),
  projectId: z.string().optional(),
  baseCode: z.string().optional(),
  imageDataUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
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

  if (userApiKey) {
    mode = "byok";
    apiKey = userApiKey;
  } else {
    const quota = await checkQuota(userId, "explore");
    if (!quota.allowed) {
      return Response.json(
        { error: quota.reason, code: "QUOTA_EXCEEDED", remaining: quota.remaining },
        { status: 402 }
      );
    }

    const deducted = await deductCredit(userId, "explore");
    if (!deducted) {
      return Response.json(
        { error: "No credits remaining.", code: "QUOTA_EXCEEDED" },
        { status: 402 }
      );
    }

    mode = "hosted";
    apiKey = process.env.ANTHROPIC_API_KEY;
  }

  const { prompt, designMd, variantCount, baseCode, imageDataUrl } = parsed.data;
  const effectiveDesignMd = designMd || "No design system provided. Use sensible defaults with a clean, modern aesthetic.";
  const { stream, usage } = baseCode
    ? createRefineStream(baseCode, prompt, effectiveDesignMd, variantCount, apiKey)
    : createExploreStream(prompt, effectiveDesignMd, variantCount, apiKey, imageDataUrl);

  void usage
    .then((u) =>
      logUsage({
        userId,
        projectId: parsed.data.projectId,
        endpoint: "explore",
        mode,
        usage: u,
        model: "claude-sonnet-4-6",
      })
    )
    .catch((err) => console.error("Usage logging failed:", err));

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}

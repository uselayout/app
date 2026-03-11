import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { createTestStream } from "@/lib/claude/test";
import { auth } from "@/lib/auth";
import { getUserTier } from "@/lib/billing/subscription";
import { checkQuota, deductCredit } from "@/lib/billing/credits";
import { logUsage } from "@/lib/billing/usage";
import type { AiMode } from "@/lib/types/billing";

const RequestSchema = z.object({
  prompt: z.string().min(1),
  designMd: z.string().optional(),
  includeContext: z.boolean(),
  projectId: z.string().optional(),
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

  // Auth: get session
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const userId = session.user.id;
  const userApiKey = request.headers.get("X-Api-Key") || undefined;

  // Determine AI mode: BYOK (user's key) or hosted (platform key)
  let mode: AiMode;
  let apiKey: string | undefined;

  if (userApiKey) {
    mode = "byok";
    apiKey = userApiKey;
  } else {
    const tier = await getUserTier(userId);
    if (tier === "free") {
      return Response.json(
        {
          error: "No API key provided. Add your Anthropic API key in Settings, or upgrade to Pro for hosted AI.",
          code: "NO_API_KEY_OR_SUBSCRIPTION",
        },
        { status: 402 }
      );
    }

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

  const { prompt, designMd, includeContext } = parsed.data;
  const { stream, usage } = createTestStream(prompt, designMd ?? null, includeContext, apiKey);

  // Fire-and-forget: log usage after stream completes
  void usage
    .then((u) =>
      logUsage({
        userId,
        projectId: parsed.data.projectId,
        endpoint: "test",
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

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createFixStream } from "@/lib/claude/edit";
import { auth } from "@/lib/auth";
import { checkQuota, deductCredit } from "@/lib/billing/credits";
import { logUsage } from "@/lib/billing/usage";
import { generateLimiter } from "@/lib/rate-limit-instances";
import { getClientIp } from "@/lib/get-client-ip";
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

  const userId = session.user.id;
  const userApiKey = request.headers.get("X-Api-Key") || undefined;

  let mode: AiMode;
  let apiKey: string | undefined;

  if (userApiKey) {
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

  const { instruction, layoutMd } = parsed.data;
  const { stream, usage } = createFixStream(instruction, layoutMd, apiKey);

  void usage
    .then((u) =>
      logUsage({
        userId,
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

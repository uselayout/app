import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createLayoutMdStream } from "@/lib/claude/synthesise";
import { resizeScreenshot } from "@/lib/util/resize-screenshot";
import { auth } from "@/lib/auth";
import { checkQuota, deductCredit, refundCredit } from "@/lib/billing/credits";
import { logUsage } from "@/lib/billing/usage";
import { generateLimiter, checkUserRateLimit, rateLimitResponse } from "@/lib/rate-limit-instances";
import { getClientIp } from "@/lib/get-client-ip";
import { registerStream, deregisterStream, isShuttingDown } from "@/lib/server/active-streams";
import type { ExtractionResult } from "@/lib/types";
import type { AiMode } from "@/lib/types/billing";

// Allow large request bodies for screenshot data (base64 images can be 2-5MB each)
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  extractionData: z.object({
    sourceType: z.string(),
    sourceName: z.string(),
    tokens: z.object({
      colors: z.array(z.record(z.string(), z.unknown())),
      typography: z.array(z.record(z.string(), z.unknown())),
      spacing: z.array(z.record(z.string(), z.unknown())),
      radius: z.array(z.record(z.string(), z.unknown())),
      effects: z.array(z.record(z.string(), z.unknown())),
    }),
    components: z.array(z.record(z.string(), z.unknown())),
    screenshots: z.array(z.string()),
    fonts: z.array(z.record(z.string(), z.unknown())),
    animations: z.array(z.record(z.string(), z.unknown())),
    librariesDetected: z.record(z.string(), z.boolean()),
    cssVariables: z.record(z.string(), z.string()),
    computedStyles: z.record(z.string(), z.unknown()),
  }),
  projectId: z.string().optional(),
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
      { error: "Missing or invalid extractionData", details: parsed.error.issues },
      { status: 400 }
    );
  }

  // Auth: get session
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const userId = session.user.id;

  const { success: withinLimit, reset } = checkUserRateLimit(userId);
  if (!withinLimit) {
    return rateLimitResponse(reset);
  }

  if (isShuttingDown()) {
    return NextResponse.json(
      { error: "Server is restarting. Please retry in a few seconds." },
      { status: 503, headers: { "Retry-After": "10" } }
    );
  }

  const userApiKey = request.headers.get("X-Api-Key") || undefined;

  // Determine AI mode: BYOK (user's key) or hosted (platform key)
  let mode: AiMode;
  let apiKey: string | undefined;

  if (userApiKey && userApiKey.startsWith("sk-ant-")) {
    mode = "byok";
    apiKey = userApiKey;
  } else {
    const quota = await checkQuota(userId, "layout-md");
    if (!quota.allowed) {
      return Response.json(
        { error: quota.reason, code: "QUOTA_EXCEEDED", remaining: quota.remaining },
        { status: 402 }
      );
    }

    const deducted = await deductCredit(userId, "layout-md");
    if (!deducted) {
      return Response.json(
        { error: "No credits remaining. Top up or use your own API key.", code: "QUOTA_EXCEEDED" },
        { status: 402 }
      );
    }

    mode = "hosted";
    apiKey = process.env.ANTHROPIC_API_KEY;
  }

  const extractionData = parsed.data.extractionData as unknown as ExtractionResult;

  // Resize screenshots server-side to keep Claude token costs reasonable
  if (extractionData.screenshots.length > 0) {
    const resized = await Promise.all(
      extractionData.screenshots.map((s) => resizeScreenshot(s))
    );
    extractionData.screenshots = resized.filter(
      (s): s is string => s !== null
    );
  }

  const streamController = registerStream();
  const { stream, usage } = createLayoutMdStream(extractionData, apiKey);

  // Log usage on success, refund credit on failure
  void usage
    .then((u) =>
      logUsage({
        userId,
        projectId: parsed.data.projectId,
        endpoint: "layout-md",
        mode,
        usage: u,
        model: "claude-sonnet-4-6",
      })
    )
    .catch(async (err) => {
      console.error("Stream failed, refunding credit:", err);
      if (mode === "hosted") {
        await refundCredit(userId, "layout-md");
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

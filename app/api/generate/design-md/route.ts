import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { createDesignMdStream } from "@/lib/claude/synthesise";
import { resizeScreenshot } from "@/lib/util/resize-screenshot";
import { auth } from "@/lib/auth";
import { getUserTier } from "@/lib/billing/subscription";
import { checkQuota, deductCredit } from "@/lib/billing/credits";
import { logUsage } from "@/lib/billing/usage";
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

    const quota = await checkQuota(userId, "design-md");
    if (!quota.allowed) {
      return Response.json(
        { error: quota.reason, code: "QUOTA_EXCEEDED", remaining: quota.remaining },
        { status: 402 }
      );
    }

    const deducted = await deductCredit(userId, "design-md");
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

  const { stream, usage } = createDesignMdStream(extractionData, apiKey);

  // Fire-and-forget: log usage after stream completes
  void usage
    .then((u) =>
      logUsage({
        userId,
        projectId: parsed.data.projectId,
        endpoint: "design-md",
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

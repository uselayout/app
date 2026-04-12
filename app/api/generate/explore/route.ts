import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createExploreStreamForModel, createRefineStreamForModel } from "@/lib/ai/providers";
import { auth } from "@/lib/auth";
import { checkQuota, deductCredit, refundCredit } from "@/lib/billing/credits";
import { logUsage } from "@/lib/billing/usage";
import { registerStream, deregisterStream, isShuttingDown } from "@/lib/server/active-streams";
import { logApiCall } from "@/lib/logging/api-log";
import { logEvent } from "@/lib/logging/platform-event";
import type { AiMode } from "@/lib/types/billing";
import { AI_MODELS, BYOK_ONLY_MODELS, DEFAULT_EXPLORE_MODEL } from "@/lib/types";
import type { AiModelId } from "@/lib/types";

const validModelIds = Object.keys(AI_MODELS) as [string, ...string[]];

const RequestSchema = z.object({
  prompt: z.string().min(1),
  layoutMd: z.string(),
  variantCount: z.number().int().min(1).max(6),
  projectId: z.string().optional(),
  baseCode: z.string().optional(),
  imageDataUrl: z.string().optional(),
  modelId: z.enum(validModelIds).optional(),
  contextFiles: z.array(z.object({
    name: z.string(),
    content: z.string().max(50_000),
  })).max(3).optional(),
  iconPacks: z.array(z.string()).optional(),
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

  if (isShuttingDown()) {
    return NextResponse.json(
      { error: "Server is restarting. Please retry in a few seconds." },
      { status: 503, headers: { "Retry-After": "10" } }
    );
  }

  const userId = session.user.id;
  const { prompt, layoutMd, variantCount, baseCode, imageDataUrl, contextFiles, iconPacks } = parsed.data;
  const modelId = (parsed.data.modelId ?? DEFAULT_EXPLORE_MODEL) as AiModelId;
  const model = AI_MODELS[modelId];
  if (!layoutMd || layoutMd.trim().length < 50) {
    return NextResponse.json(
      { error: "No design system loaded. Extract from a Figma file or website first to generate on-brand variants." },
      { status: 400 }
    );
  }
  const effectiveLayoutMd = layoutMd;

  // Resolve API key + billing mode based on provider
  let mode: AiMode;
  let effectiveApiKey: string | undefined;

  if (model.provider === "gemini") {
    // Gemini: always BYOK for now (user or env key)
    const googleKey = request.headers.get("X-Google-Api-Key") || undefined;
    effectiveApiKey = googleKey || process.env.GOOGLE_AI_API_KEY;
    if (!effectiveApiKey) {
      return Response.json(
        { error: "Google AI API key is required for Gemini models. Add one in Settings." },
        { status: 400 }
      );
    }
    mode = "byok";
  } else {
    // Claude: BYOK or hosted with quota
    const userApiKey = request.headers.get("X-Api-Key") || undefined;
    if (userApiKey && userApiKey.startsWith("sk-ant-")) {
      mode = "byok";
      effectiveApiKey = userApiKey;
    } else if (BYOK_ONLY_MODELS.has(modelId)) {
      return Response.json(
        { error: `${model.label} requires your own API key. Add one in Settings.`, code: "BYOK_REQUIRED" },
        { status: 402 }
      );
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
      effectiveApiKey = process.env.ANTHROPIC_API_KEY;
    }
  }

  const streamController = registerStream();
  const startTime = Date.now();
  const isRefinement = !!baseCode;

  const apiLogMetadata = {
    projectId: parsed.data.projectId,
    variantCount,
    modelId,
    hasImageUpload: !!imageDataUrl,
    hasContextFiles: (contextFiles?.length ?? 0) > 0,
    contextFileCount: contextFiles?.length ?? 0,
    iconPacks: iconPacks ?? [],
    isRefinement,
    promptLength: prompt.length,
  };

  const { stream, usage } = baseCode
    ? createRefineStreamForModel(modelId, {
        baseCode,
        refinementPrompt: prompt,
        layoutMd: effectiveLayoutMd,
        variantCount,
        apiKey: effectiveApiKey,
        contextFiles,
        imageDataUrl,
        modelId,
        iconPacks,
      })
    : createExploreStreamForModel(modelId, {
        prompt,
        layoutMd: effectiveLayoutMd,
        variantCount,
        apiKey: effectiveApiKey,
        imageDataUrl,
        contextFiles,
        modelId,
        iconPacks,
      });

  void usage
    .then((u) => {
      void logApiCall({ userId, endpoint: "generate/explore", statusCode: 200, durationMs: Date.now() - startTime, metadata: apiLogMetadata });
      void logEvent("variant.generated", "studio", { userId, metadata: { variantCount, modelId, isRefinement, hasImageUpload: !!imageDataUrl, prompt } });
      return logUsage({
        userId,
        projectId: parsed.data.projectId,
        endpoint: "explore",
        mode,
        usage: u,
        model: modelId,
      });
    })
    .catch(async (err) => {
      console.error("Stream failed, refunding credit:", err);
      void logApiCall({ userId, endpoint: "generate/explore", statusCode: 500, durationMs: Date.now() - startTime, errorMessage: err instanceof Error ? err.message : String(err), metadata: apiLogMetadata });
      if (mode === "hosted") {
        await refundCredit(userId, "explore");
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

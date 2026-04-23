import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createExploreStreamForModel, createRefineStreamForModel } from "@/lib/ai/providers";
import { auth } from "@/lib/auth";
import { checkQuota, deductCredit, refundCredit } from "@/lib/billing/credits";
import { logUsage } from "@/lib/billing/usage";
import { registerStream, deregisterStream, isShuttingDown } from "@/lib/server/active-streams";
import { logApiCall } from "@/lib/logging/api-log";
import { logEvent } from "@/lib/logging/platform-event";
import { getModelById, getDefaultModel, getModelCreditCost } from "@/lib/ai/models";
import type { AiMode } from "@/lib/types/billing";
import { AI_MODELS, BYOK_ONLY_MODELS, DEFAULT_EXPLORE_MODEL } from "@/lib/types";
import type { AiModelId } from "@/lib/types";
import { fetchProjectById } from "@/lib/supabase/db";
import { deriveLayoutMd } from "@/lib/layout-md/derive";

const RequestSchema = z.object({
  prompt: z.string().min(1),
  layoutMd: z.string(),
  variantCount: z.number().int().min(1).max(6),
  projectId: z.string().optional(),
  baseCode: z.string().optional(),
  imageDataUrl: z.string().optional(),
  modelId: z.string().optional(),
  contextFiles: z.array(z.object({
    name: z.string(),
    content: z.string().max(50_000),
  })).max(3).optional(),
  iconPacks: z.array(z.string()).optional(),
});

const CONTEXT_FILE_MAX_CHARS = 50_000;
const CONTEXT_FILE_MAX_COUNT = 3;

function preValidateContextFiles(body: unknown): Response | null {
  if (!body || typeof body !== "object" || !("contextFiles" in body)) return null;
  const raw = (body as { contextFiles: unknown }).contextFiles;
  if (!Array.isArray(raw)) return null;

  if (raw.length > CONTEXT_FILE_MAX_COUNT) {
    return Response.json(
      {
        error: `You attached ${raw.length} context files but the maximum is ${CONTEXT_FILE_MAX_COUNT}. Remove some and try again.`,
      },
      { status: 400 }
    );
  }

  for (const file of raw) {
    if (!file || typeof file !== "object") continue;
    const content = (file as { content?: unknown }).content;
    if (typeof content !== "string" || content.length <= CONTEXT_FILE_MAX_CHARS) continue;
    const nameRaw = (file as { name?: unknown }).name;
    const name = typeof nameRaw === "string" && nameRaw ? nameRaw : "(unnamed)";
    const sizeKb = Math.round(content.length / 1024);
    return Response.json(
      {
        error: `Context file "${name}" is ${sizeKb}KB. Each file must be ≤ ${CONTEXT_FILE_MAX_CHARS / 1000}KB. Trim the file and retry.`,
      },
      { status: 400 }
    );
  }

  return null;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Surface friendly errors for oversized context files BEFORE Zod, so the
  // user sees which file is too big (and by how much) rather than a generic
  // "Invalid request" with Zod issues they can't decode.
  const preError = preValidateContextFiles(body);
  if (preError) return preError;

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
  let modelId: AiModelId = parsed.data.modelId ?? DEFAULT_EXPLORE_MODEL;
  let model = AI_MODELS[modelId];
  let didFallback = false;

  // Try DB model registry, fall back to hardcoded
  const dbModel = await getModelById(modelId);
  if (dbModel) {
    model = { id: dbModel.id, label: dbModel.label, provider: dbModel.provider, maxOutputTokens: dbModel.maxOutputTokens };
  } else if (!model) {
    return Response.json({ error: `Unknown model: ${modelId}` }, { status: 400 });
  }

  // Always derive layout.md server-side when we have a projectId. This
  // regenerates the CORE TOKENS block from the latest curated assignments
  // and Appendix A from the latest tokens — beating any stale Zustand/prop
  // snapshot the client might have sent. Falls back to the client payload
  // for projectless playground use.
  let effectiveLayoutMd = layoutMd;
  if (parsed.data.projectId) {
    const fresh = await fetchProjectById(parsed.data.projectId);
    if (fresh) {
      const derived = deriveLayoutMd(fresh);
      if (derived.trim().length > 0) {
        const lengthDelta = Math.abs(derived.length - layoutMd.length);
        if (lengthDelta > 100) {
          console.log(
            `[explore] Using server-derived layout.md (client delta: ${lengthDelta} chars, project ${parsed.data.projectId})`
          );
        }
        effectiveLayoutMd = derived;
      }
    }
  }

  if (!effectiveLayoutMd || effectiveLayoutMd.trim().length < 50) {
    return NextResponse.json(
      { error: "Add content to layout.md first. Extract a design system, start blank, or paste your own design guidelines." },
      { status: 400 }
    );
  }

  // Resolve API key + billing mode based on provider
  let mode: AiMode;
  let effectiveApiKey: string | undefined;
  const perVariantCost = await getModelCreditCost(modelId);
  let creditCost = perVariantCost * variantCount;

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
    } else if (dbModel?.byokOnly ?? BYOK_ONLY_MODELS.has(modelId)) {
      return Response.json(
        { error: `${model.label} requires your own API key. Add one in Settings.`, code: "BYOK_REQUIRED" },
        { status: 402 }
      );
    } else {
      const quota = await checkQuota(userId, "explore", creditCost);
      if (!quota.allowed) {
        // Auto-fallback: if this model costs more than 1 credit, try the default model
        if (creditCost > 1) {
          const defaultModel = await getDefaultModel();
          const defaultCost = defaultModel.creditCost * variantCount;
          const fallbackQuota = await checkQuota(userId, "explore", defaultCost);
          if (fallbackQuota.allowed) {
            // Switch to default model
            modelId = defaultModel.id;
            model = { id: defaultModel.id, label: defaultModel.label, provider: defaultModel.provider, maxOutputTokens: defaultModel.maxOutputTokens };
            creditCost = defaultCost;
            didFallback = true;
          } else {
            return Response.json(
              { error: quota.reason, code: "QUOTA_EXCEEDED", remaining: quota.remaining },
              { status: 402 }
            );
          }
        } else {
          return Response.json(
            { error: quota.reason, code: "QUOTA_EXCEEDED", remaining: quota.remaining },
            { status: 402 }
          );
        }
      }

      const deducted = await deductCredit(userId, "explore", creditCost);
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

  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Accel-Buffering": "no",
  };
  if (didFallback) {
    headers["X-Model-Fallback"] = "true";
    headers["X-Model-Used"] = modelId;
  }

  return new Response(stream, { headers });
}

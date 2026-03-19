import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { createExploreStreamForModel, createRefineStreamForModel } from "@/lib/ai/providers";
import { auth } from "@/lib/auth";
import { checkQuota, deductCredit } from "@/lib/billing/credits";
import { logUsage } from "@/lib/billing/usage";
import type { AiMode } from "@/lib/types/billing";
import { AI_MODELS, DEFAULT_EXPLORE_MODEL } from "@/lib/types";
import type { AiModelId } from "@/lib/types";

const validModelIds = Object.keys(AI_MODELS) as [string, ...string[]];

const RequestSchema = z.object({
  prompt: z.string().min(1),
  designMd: z.string(),
  variantCount: z.number().int().min(1).max(6),
  projectId: z.string().optional(),
  baseCode: z.string().optional(),
  imageDataUrl: z.string().optional(),
  modelId: z.enum(validModelIds).optional(),
  contextFiles: z.array(z.object({
    name: z.string(),
    content: z.string().max(50_000),
  })).max(3).optional(),
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
  const { prompt, designMd, variantCount, baseCode, imageDataUrl, contextFiles } = parsed.data;
  const modelId = (parsed.data.modelId ?? DEFAULT_EXPLORE_MODEL) as AiModelId;
  const model = AI_MODELS[modelId];
  const effectiveDesignMd = designMd || "No design system provided. Use sensible defaults with a clean, modern aesthetic.";

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
    if (userApiKey) {
      mode = "byok";
      effectiveApiKey = userApiKey;
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

  const { stream, usage } = baseCode
    ? createRefineStreamForModel(modelId, {
        baseCode,
        refinementPrompt: prompt,
        designMd: effectiveDesignMd,
        variantCount,
        apiKey: effectiveApiKey,
        contextFiles,
        imageDataUrl,
      })
    : createExploreStreamForModel(modelId, {
        prompt,
        designMd: effectiveDesignMd,
        variantCount,
        apiKey: effectiveApiKey,
        imageDataUrl,
        contextFiles,
      });

  void usage
    .then((u) =>
      logUsage({
        userId,
        projectId: parsed.data.projectId,
        endpoint: "explore",
        mode,
        usage: u,
        model: modelId,
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

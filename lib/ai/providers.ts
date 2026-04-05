/**
 * AI provider abstraction for Explorer Canvas variant generation.
 *
 * Routes to Claude or Gemini based on the selected model.
 */

import type { StreamWithUsage } from "@/lib/types/billing";
import type { AiModelId } from "@/lib/types";
import { AI_MODELS } from "@/lib/types";
import { createExploreStream, createRefineStream } from "@/lib/claude/explore";
import {
  createGeminiExploreStream,
  createGeminiRefineStream,
} from "@/lib/ai/gemini-explore";

export interface ExploreOptions {
  prompt: string;
  layoutMd: string;
  variantCount: number;
  apiKey?: string;
  imageDataUrl?: string;
  contextFiles?: Array<{ name: string; content: string }>;
  modelId?: string;
  iconPacks?: string[];
}

export interface RefineOptions {
  baseCode: string;
  refinementPrompt: string;
  layoutMd: string;
  variantCount: number;
  apiKey?: string;
  contextFiles?: Array<{ name: string; content: string }>;
  imageDataUrl?: string;
  modelId?: string;
  iconPacks?: string[];
}

export function createExploreStreamForModel(
  modelId: AiModelId,
  options: ExploreOptions,
): StreamWithUsage {
  const model = AI_MODELS[modelId];

  if (model.provider === "gemini") {
    return createGeminiExploreStream(
      options.prompt,
      options.layoutMd,
      options.variantCount,
      options.apiKey,
      options.imageDataUrl,
      options.contextFiles,
      options.iconPacks,
    );
  }

  // Default: Claude
  return createExploreStream(
    options.prompt,
    options.layoutMd,
    options.variantCount,
    options.apiKey,
    options.imageDataUrl,
    options.contextFiles,
    options.modelId,
    options.iconPacks,
  );
}

export function createRefineStreamForModel(
  modelId: AiModelId,
  options: RefineOptions,
): StreamWithUsage {
  const model = AI_MODELS[modelId];

  if (model.provider === "gemini") {
    return createGeminiRefineStream(
      options.baseCode,
      options.refinementPrompt,
      options.layoutMd,
      options.variantCount,
      options.apiKey,
      options.contextFiles,
      options.imageDataUrl,
      options.iconPacks,
    );
  }

  // Default: Claude
  return createRefineStream(
    options.baseCode,
    options.refinementPrompt,
    options.layoutMd,
    options.variantCount,
    options.apiKey,
    options.contextFiles,
    options.imageDataUrl,
    options.modelId,
    options.iconPacks,
  );
}

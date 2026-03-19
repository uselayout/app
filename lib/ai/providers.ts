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
  designMd: string;
  variantCount: number;
  apiKey?: string;
  imageDataUrl?: string;
  contextFiles?: Array<{ name: string; content: string }>;
}

export interface RefineOptions {
  baseCode: string;
  refinementPrompt: string;
  designMd: string;
  variantCount: number;
  apiKey?: string;
  contextFiles?: Array<{ name: string; content: string }>;
  imageDataUrl?: string;
}

export function createExploreStreamForModel(
  modelId: AiModelId,
  options: ExploreOptions,
): StreamWithUsage {
  const model = AI_MODELS[modelId];

  if (model.provider === "gemini") {
    return createGeminiExploreStream(
      options.prompt,
      options.designMd,
      options.variantCount,
      options.apiKey,
      options.imageDataUrl,
      options.contextFiles,
    );
  }

  // Default: Claude
  return createExploreStream(
    options.prompt,
    options.designMd,
    options.variantCount,
    options.apiKey,
    options.imageDataUrl,
    options.contextFiles,
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
      options.designMd,
      options.variantCount,
      options.apiKey,
      options.contextFiles,
      options.imageDataUrl,
    );
  }

  // Default: Claude
  return createRefineStream(
    options.baseCode,
    options.refinementPrompt,
    options.designMd,
    options.variantCount,
    options.apiKey,
    options.contextFiles,
    options.imageDataUrl,
  );
}

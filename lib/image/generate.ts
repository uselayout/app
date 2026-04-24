/**
 * Image generation — multi-provider entry point.
 *
 * Delegates to the provider router (lib/image/providers/router.ts) which picks
 * between Gemini 3.1 Flash Image Preview (default) and OpenAI GPT Image 2.0
 * (text-heavy prompts, or when only an OpenAI key is present).
 */

import { supabase } from "@/lib/supabase/client";
import {
  generateWithRouter,
  RateLimitError,
  type ProviderName,
} from "./providers/router";
import type {
  AspectRatio,
  ImageStyle,
  Resolution,
} from "./providers/types";

export { ImageSafetyError } from "./providers/router";
export type { AspectRatio, ImageStyle, Resolution };
export type { ProviderName } from "./providers/router";

export interface GenerateImageOptions {
  prompt: string;
  style?: ImageStyle;
  aspectRatio?: AspectRatio;
  resolution?: Resolution;
  brandColours?: string[];
  brandStyle?: string;
  orgId?: string;
  /** User-provided Google AI API key (BYOK) — falls back to env var */
  googleApiKey?: string;
  /** User-provided OpenAI API key (BYOK) */
  openaiApiKey?: string;
  /** Force a specific provider; otherwise auto-route by prompt content. */
  forcedProvider?: ProviderName;
}

export interface GeneratedImage {
  url: string;
  mimeType: string;
  prompt: string;
  provider: ProviderName;
}

function resolveKeys(options: GenerateImageOptions) {
  const googleApiKey = options.googleApiKey || process.env.GOOGLE_AI_API_KEY;
  const openaiApiKey = options.openaiApiKey || process.env.OPENAI_API_KEY;
  return { googleApiKey, openaiApiKey };
}

async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof RateLimitError && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[image/generate] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
}

/**
 * Generate raw image bytes via the configured provider.
 * Auto-retries on rate limits; safety-retries handled inside each provider.
 */
export async function generateImageRaw(
  options: GenerateImageOptions,
): Promise<{ data: string; mimeType: string; provider: ProviderName }> {
  const keys = resolveKeys(options);

  return withRateLimitRetry(() =>
    generateWithRouter({
      prompt: options.prompt,
      style: options.style,
      aspectRatio: options.aspectRatio,
      resolution: options.resolution,
      brandColours: options.brandColours,
      brandStyle: options.brandStyle,
      keys,
      forced: options.forcedProvider,
    }),
  );
}

/**
 * Generate an image and upload it to Supabase Storage.
 * Falls back to inline data URL if storage upload fails.
 */
export async function generateImage(
  options: GenerateImageOptions,
): Promise<GeneratedImage> {
  const { data, mimeType, provider } = await generateImageRaw(options);

  try {
    const buffer = Buffer.from(data, "base64");
    const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
    const filename = `generated/${options.orgId ?? "anon"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("layout-images")
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (!uploadError) {
      const proxyUrl = `/api/storage/layout-images/${filename}`;
      return { url: proxyUrl, mimeType, prompt: options.prompt, provider };
    }

    console.error(`[image/generate] Storage upload to bucket "layout-images" failed: ${uploadError.message}. Falling back to base64 data URL (will cause large code). Run migration 038_layout_images_bucket.sql to fix.`);
  } catch (storageErr) {
    console.error("[image/generate] Storage upload to bucket \"layout-images\" error:", storageErr, "Falling back to base64 data URL. Run migration 038_layout_images_bucket.sql to fix.");
  }

  return {
    url: `data:${mimeType};base64,${data}`,
    mimeType,
    prompt: options.prompt,
    provider,
  };
}

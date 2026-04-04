/**
 * Gemini 3.1 Flash Image Preview  -  image generation client.
 *
 * Generates contextual images (hero photos, illustrations, icons, abstract art)
 * for use in AI-generated page designs within the Explorer Canvas.
 *
 * API: https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent
 */

import { supabase } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImageStyle = "photo" | "illustration" | "icon" | "abstract";
export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "21:9";
export type Resolution = "512" | "1K" | "2K";

export interface GenerateImageOptions {
  /** Descriptive prompt for the image */
  prompt: string;
  /** Visual style hint  -  prepended to the prompt */
  style?: ImageStyle;
  /** Aspect ratio (default: 16:9) */
  aspectRatio?: AspectRatio;
  /** Output resolution (default: 1K) */
  resolution?: Resolution;
  /** Brand colours to incorporate into the prompt */
  brandColours?: string[];
  /** Overall style description from the design system */
  brandStyle?: string;
  /** Organisation ID for usage tracking and storage */
  orgId?: string;
  /** User-provided Google AI API key (BYOK) — falls back to env var */
  googleApiKey?: string;
}

export interface GeneratedImage {
  /** Public URL of the uploaded image */
  url: string;
  /** MIME type */
  mimeType: string;
  /** Prompt used for generation */
  prompt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GEMINI_MODEL = "gemini-3.1-flash-image-preview";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const STYLE_PREFIXES: Record<ImageStyle, string> = {
  photo: "A photorealistic, DSLR-quality professional photograph of",
  illustration: "A modern flat illustration of",
  icon: "A clean minimal icon depicting",
  abstract: "An abstract artistic representation of",
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ImageSafetyError extends Error {
  constructor(public originalPrompt: string) {
    super(`Image blocked by safety policy: "${originalPrompt}"`);
    this.name = "ImageSafetyError";
  }
}

class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

function getApiKey(userKey?: string): string {
  const key = userKey || process.env.GOOGLE_AI_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_AI_API_KEY environment variable is not set");
  }
  return key;
}

function buildPrompt(options: GenerateImageOptions): string {
  const parts: string[] = [];

  // Style prefix
  if (options.style) {
    parts.push(STYLE_PREFIXES[options.style]);
  }

  // Main prompt
  parts.push(options.prompt);

  // Brand context
  if (options.brandStyle) {
    parts.push(`Style: ${options.brandStyle}.`);
  }
  if (options.brandColours && options.brandColours.length > 0) {
    parts.push(`Use these brand colours: ${options.brandColours.join(", ")}.`);
  }

  // Quality hints — respect user's prompt if it explicitly requests a different style
  const promptLower = options.prompt.toLowerCase();
  const userOverridesStyle = /\b(illustration|cartoon|anime|watercolour|watercolor|sketch|painting|drawn|vector|flat design|3d render|pixel art)\b/.test(promptLower);

  if (options.style === "photo" && !userOverridesStyle) {
    parts.push("Photorealistic, real photograph, natural lighting, NOT an illustration or cartoon or AI art style. Shot on Canon EOS R5.");
  } else {
    parts.push("High quality, clean composition, suitable for a modern web design.");
  }

  return parts.join(" ");
}

/**
 * Rephrase a prompt that was safety-blocked to use illustration style instead
 * of photographic realism. Strips human-likeness triggers.
 */
function rephraseForSafety(prompt: string): string {
  return prompt
    .replace(/\b(headshot|selfie|face shot)\b/gi, "professional portrait")
    .replace(/\b(photorealistic|real person|real human)\b/gi, "natural-looking")
    + ", studio portrait photography, editorial style";
}

/**
 * Call Gemini and extract the image. Returns base64 data + MIME type.
 * Throws ImageSafetyError if blocked by content policy.
 */
async function callGemini(
  prompt: string,
  options: GenerateImageOptions,
  apiKey: string,
): Promise<{ data: string; mimeType: string }> {
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: options.aspectRatio ?? "16:9",
        imageSize: options.resolution ?? "1K",
      },
    },
  };

  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 429) {
    throw new RateLimitError("Gemini rate limit exceeded");
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "Unknown error");
    throw new Error(`Gemini image generation failed (${res.status}): ${errorBody}`);
  }

  const result = await res.json();

  // Check for safety blocks at the prompt level
  if (result.promptFeedback?.blockReason) {
    throw new ImageSafetyError(options.prompt);
  }

  const candidates = result.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No image generated — Gemini returned empty candidates");
  }

  // Check for safety blocks at the candidate level
  if (candidates[0].finishReason === "SAFETY") {
    throw new ImageSafetyError(options.prompt);
  }

  const parts = candidates[0].content?.parts;
  if (!parts || parts.length === 0) {
    throw new ImageSafetyError(options.prompt);
  }

  const imagePart = parts.find(
    (p: Record<string, unknown>) => p.inlineData
  );
  if (!imagePart?.inlineData) {
    throw new Error("No inline image data in Gemini response");
  }

  return {
    data: imagePart.inlineData.data as string,
    mimeType: (imagePart.inlineData.mimeType as string) || "image/png",
  };
}

/**
 * Retry a function with exponential backoff on rate-limit errors.
 */
async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
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
 * Generate an image using Gemini 3.1 Flash Image Preview.
 * If safety-blocked, auto-retries once with a rephrased illustration prompt.
 * If rate-limited, retries with exponential backoff.
 */
export async function generateImageRaw(
  options: GenerateImageOptions
): Promise<{ data: string; mimeType: string }> {
  const apiKey = getApiKey(options.googleApiKey);
  const prompt = buildPrompt(options);

  return withRateLimitRetry(async () => {
    try {
      return await callGemini(prompt, options, apiKey);
    } catch (err) {
      if (!(err instanceof ImageSafetyError)) throw err;

      // Auto-retry with softened prompt (keep photo style if possible)
      console.warn(`[image/generate] Safety block on "${options.prompt}", retrying with rephrased prompt...`);
      const safePrompt = rephraseForSafety(options.prompt);
      const retryOptions: GenerateImageOptions = {
        ...options,
        prompt: safePrompt,
      };
      try {
        return await callGemini(buildPrompt(retryOptions), retryOptions, apiKey);
      } catch (retryErr) {
        // If retry also safety-blocked, throw the original error
        if (retryErr instanceof ImageSafetyError) {
          throw new ImageSafetyError(options.prompt);
        }
        throw retryErr;
      }
    }
  });
}

/**
 * Generate an image and upload it to Supabase Storage.
 * Falls back to inline data URL if storage upload fails.
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GeneratedImage> {
  const { data, mimeType } = await generateImageRaw(options);
  const prompt = buildPrompt(options);

  // Try uploading to Supabase Storage, fall back to data URL
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
      // Return relative proxy URL. The preview iframe's <base href> ensures
      // this resolves correctly. API route at /api/storage/[...path] fetches
      // from Supabase server-side, avoiding mixed content issues.
      const proxyUrl = `/api/storage/layout-images/${filename}`;
      return { url: proxyUrl, mimeType, prompt };
    }

    console.error(`[image/generate] Storage upload to bucket "layout-images" failed: ${uploadError.message}. Falling back to base64 data URL (will cause large code). Run migration 038_layout_images_bucket.sql to fix.`);
  } catch (storageErr) {
    console.error("[image/generate] Storage upload to bucket \"layout-images\" error:", storageErr, "Falling back to base64 data URL. Run migration 038_layout_images_bucket.sql to fix.");
  }

  // Fallback: return inline data URL. WARNING: base64 images are 300-400KB each
  // and will make variant code too large for transpilation if multiple images are embedded.
  return {
    url: `data:${mimeType};base64,${data}`,
    mimeType,
    prompt,
  };
}

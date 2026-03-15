/**
 * Gemini 3.1 Flash Image Preview — image generation client.
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
  /** Visual style hint — prepended to the prompt */
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
  photo: "A high-quality professional photograph of",
  illustration: "A modern flat illustration of",
  icon: "A clean minimal icon depicting",
  abstract: "An abstract artistic representation of",
};

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

function getApiKey(): string {
  const key = process.env.GOOGLE_AI_API_KEY;
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

  // Quality hints
  parts.push("High quality, clean composition, suitable for a modern web design.");

  return parts.join(" ");
}

/**
 * Generate an image using Gemini 3.1 Flash Image Preview.
 * Returns base64 data and MIME type.
 */
export async function generateImageRaw(
  options: GenerateImageOptions
): Promise<{ data: string; mimeType: string }> {
  const apiKey = getApiKey();
  const prompt = buildPrompt(options);

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageGenerationConfig: {
        aspectRatio: options.aspectRatio ?? "16:9",
        resolution: options.resolution ?? "1K",
      },
    },
  };

  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "Unknown error");
    throw new Error(`Gemini image generation failed (${res.status}): ${errorBody}`);
  }

  const result = await res.json();

  // Extract image from response
  const candidates = result.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No image generated — Gemini returned empty candidates");
  }

  const parts = candidates[0].content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error("No image data in Gemini response");
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
 * Generate an image and upload it to Supabase Storage.
 * Returns the public URL.
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GeneratedImage> {
  const { data, mimeType } = await generateImageRaw(options);
  const prompt = buildPrompt(options);

  // Convert base64 to buffer
  const buffer = Buffer.from(data, "base64");

  // Determine file extension
  const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
  const filename = `generated/${options.orgId ?? "anon"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(filename, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload generated image: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("images")
    .getPublicUrl(filename);

  return {
    url: publicUrlData.publicUrl,
    mimeType,
    prompt,
  };
}

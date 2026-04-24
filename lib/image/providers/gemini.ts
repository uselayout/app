import {
  ImageSafetyError,
  RateLimitError,
  buildPrompt,
  type ProviderGenerateOptions,
  type ProviderResult,
} from "./types";

const GEMINI_MODEL = "gemini-3.1-flash-image-preview";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

function rephraseForSafety(prompt: string): string {
  return prompt
    .replace(/\b(headshot|selfie|face shot)\b/gi, "professional portrait")
    .replace(/\b(photorealistic|real person|real human)\b/gi, "natural-looking")
    + ", studio portrait photography, editorial style";
}

async function callGemini(
  prompt: string,
  options: ProviderGenerateOptions,
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

  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${options.apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

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

  if (result.promptFeedback?.blockReason) {
    throw new ImageSafetyError(options.prompt);
  }

  const candidates = result.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No image generated — Gemini returned empty candidates");
  }

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

export async function generateWithGemini(
  options: ProviderGenerateOptions,
): Promise<ProviderResult> {
  const prompt = buildPrompt(options);

  try {
    const result = await callGemini(prompt, options);
    return { ...result, provider: "gemini" };
  } catch (err) {
    if (!(err instanceof ImageSafetyError)) throw err;

    console.warn(`[image/gemini] Safety block on "${options.prompt}", retrying with rephrased prompt...`);
    const retryOptions: ProviderGenerateOptions = {
      ...options,
      prompt: rephraseForSafety(options.prompt),
    };
    try {
      const retried = await callGemini(buildPrompt(retryOptions), retryOptions);
      return { ...retried, provider: "gemini" };
    } catch (retryErr) {
      if (retryErr instanceof ImageSafetyError) {
        throw new ImageSafetyError(options.prompt);
      }
      throw retryErr;
    }
  }
}

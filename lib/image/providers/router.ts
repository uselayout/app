import { generateWithGemini } from "./gemini";
import { generateWithOpenAI } from "./openai";
import {
  ImageSafetyError,
  RateLimitError,
  type ProviderGenerateOptions,
  type ProviderName,
  type ProviderResult,
} from "./types";

export interface ProviderKeys {
  googleApiKey?: string;
  openaiApiKey?: string;
}

const TEXT_HEAVY_RE =
  /\b(logo|logomark|logotype|wordmark|mark|favicon|diagram|chart|infographic|poster|flyer|ui mockup|screen mockup|with text|text that reads|sign that says|label(?:led|s)?|brand identity|typography poster)\b/i;

/**
 * Pick the best provider for a prompt given available keys.
 * Forced provider wins. Otherwise route text-heavy prompts to OpenAI
 * (GPT Image 2.0 renders text legibly; Gemini does not).
 */
export function pickProvider(
  prompt: string,
  keys: ProviderKeys,
  forced?: ProviderName,
): ProviderName | null {
  const { googleApiKey, openaiApiKey } = keys;
  const hasGoogle = !!googleApiKey;
  const hasOpenAI = !!openaiApiKey;

  if (forced === "openai") return hasOpenAI ? "openai" : hasGoogle ? "gemini" : null;
  if (forced === "gemini") return hasGoogle ? "gemini" : hasOpenAI ? "openai" : null;

  if (!hasGoogle && !hasOpenAI) return null;
  if (!hasGoogle) return "openai";
  if (!hasOpenAI) return "gemini";

  return TEXT_HEAVY_RE.test(prompt) ? "openai" : "gemini";
}

export interface RouteOptions extends Omit<ProviderGenerateOptions, "apiKey"> {
  keys: ProviderKeys;
  /** Override auto-routing. */
  forced?: ProviderName;
}

export async function generateWithRouter(
  options: RouteOptions,
): Promise<ProviderResult> {
  const provider = pickProvider(options.prompt, options.keys, options.forced);
  if (!provider) {
    throw new Error(
      "No image generation API key configured. Add a Google AI or OpenAI key in Settings.",
    );
  }

  const apiKey = provider === "openai" ? options.keys.openaiApiKey! : options.keys.googleApiKey!;
  const providerOptions: ProviderGenerateOptions = {
    prompt: options.prompt,
    style: options.style,
    aspectRatio: options.aspectRatio,
    resolution: options.resolution,
    brandColours: options.brandColours,
    brandStyle: options.brandStyle,
    apiKey,
  };

  if (provider === "openai") {
    return generateWithOpenAI(providerOptions);
  }
  return generateWithGemini(providerOptions);
}

export { ImageSafetyError, RateLimitError };
export type { ProviderName, ProviderResult };

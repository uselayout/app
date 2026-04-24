export type ImageStyle = "photo" | "illustration" | "icon" | "abstract";
export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "21:9";
export type Resolution = "512" | "1K" | "2K";

export type ProviderName = "gemini" | "openai";

export interface ReferenceImage {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface ProviderGenerateOptions {
  prompt: string;
  style?: ImageStyle;
  aspectRatio?: AspectRatio;
  resolution?: Resolution;
  brandColours?: string[];
  brandStyle?: string;
  apiKey: string;
  /** Optional PNG/JPEG reference images. OpenAI provider routes these
   * through /v1/images/edits so the model composes around the real marks. */
  referenceImages?: ReferenceImage[];
}

export interface ProviderResult {
  data: string;
  mimeType: string;
  provider: ProviderName;
}

export class ImageSafetyError extends Error {
  constructor(public originalPrompt: string) {
    super(`Image blocked by safety policy: "${originalPrompt}"`);
    this.name = "ImageSafetyError";
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export const STYLE_PREFIXES: Record<ImageStyle, string> = {
  photo: "A photorealistic, DSLR-quality professional photograph of",
  illustration: "A modern flat illustration of",
  icon: "A clean minimal icon depicting",
  abstract: "An abstract artistic representation of",
};

export function buildPrompt(options: {
  prompt: string;
  style?: ImageStyle;
  brandColours?: string[];
  brandStyle?: string;
}): string {
  const parts: string[] = [];

  if (options.style) {
    parts.push(STYLE_PREFIXES[options.style]);
  }

  parts.push(options.prompt);

  if (options.brandStyle) {
    parts.push(`Style: ${options.brandStyle}.`);
  }
  if (options.brandColours && options.brandColours.length > 0) {
    parts.push(`Use these brand colours: ${options.brandColours.join(", ")}.`);
  }

  const promptLower = options.prompt.toLowerCase();
  const userOverridesStyle = /\b(illustration|cartoon|anime|watercolour|watercolor|sketch|painting|drawn|vector|flat design|3d render|pixel art)\b/.test(promptLower);

  if (options.style === "photo" && !userOverridesStyle) {
    parts.push("Photorealistic, real photograph, natural lighting, NOT an illustration or cartoon or AI art style. Shot on Canon EOS R5.");
  } else {
    parts.push("High quality, clean composition, suitable for a modern web design.");
  }

  return parts.join(" ");
}

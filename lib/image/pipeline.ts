/**
 * Image pipeline  -  scans generated HTML for image placeholders and
 * replaces them with AI-generated images.
 *
 * Placeholders use the format:
 *   <img data-generate-image="description of the image" ... />
 *
 * The pipeline:
 *   1. Scans HTML/JSX for data-generate-image attributes
 *   2. Extracts prompts from each placeholder
 *   3. Generates images in parallel via Gemini
 *   4. Replaces placeholder src attributes with real URLs
 */

import { generateImage, ImageSafetyError, type ImageStyle, type AspectRatio } from "./generate";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImagePlaceholder {
  /** Full matched string in the source */
  match: string;
  /** Image generation prompt from data-generate-image */
  prompt: string;
  /** Style hint from data-image-style (optional) */
  style?: ImageStyle;
  /** Aspect ratio from data-image-ratio (optional) */
  aspectRatio?: AspectRatio;
  /** Alt text if present */
  alt?: string;
}

export interface PipelineOptions {
  /** Organisation ID for storage and tracking */
  orgId?: string;
  /** Brand colours from design system */
  brandColours?: string[];
  /** Brand style description */
  brandStyle?: string;
  /** Maximum concurrent generations (default: 3) */
  concurrency?: number;
  /** Callback when an individual image completes */
  onImageComplete?: (index: number, url: string) => void;
  /** User-provided Google AI API key (BYOK) */
  googleApiKey?: string;
}

// ---------------------------------------------------------------------------
// Placeholder detection
// ---------------------------------------------------------------------------

const PLACEHOLDER_REGEX =
  /(<img\s[^>]*?)data-generate-image=["']([^"']+)["']([^>]*?)\/?>/gi;

const STYLE_ATTR_REGEX = /data-image-style=["']([^"']+)["']/i;
const RATIO_ATTR_REGEX = /data-image-ratio=["']([^"']+)["']/i;
const ALT_ATTR_REGEX = /alt=["']([^"']+)["']/i;

export function findPlaceholders(html: string): ImagePlaceholder[] {
  const placeholders: ImagePlaceholder[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  PLACEHOLDER_REGEX.lastIndex = 0;

  while ((match = PLACEHOLDER_REGEX.exec(html)) !== null) {
    const fullMatch = match[0];
    const prompt = match[2];
    const fullTag = match[1] + match[3];

    const styleMatch = fullTag.match(STYLE_ATTR_REGEX);
    const ratioMatch = fullTag.match(RATIO_ATTR_REGEX);
    const altMatch = fullTag.match(ALT_ATTR_REGEX);

    placeholders.push({
      match: fullMatch,
      prompt,
      style: styleMatch?.[1] as ImageStyle | undefined,
      aspectRatio: ratioMatch?.[1] as AspectRatio | undefined,
      alt: altMatch?.[1],
    });
  }

  return placeholders;
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export interface PipelineResult {
  html: string;
  totalCount: number;
  failedCount: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Placeholder URL replacement — catches cases where the AI uses external URLs
// instead of data-generate-image attributes
// ---------------------------------------------------------------------------

const PLACEHOLDER_URL_REGEX =
  /(<img\s[^>]*?)src=["']((?:https?:)?\/\/(?:placehold\.co|via\.placeholder\.com|placeholder\.com|images\.unsplash\.com|source\.unsplash\.com|picsum\.photos|dummyimage\.com|lorempixel\.com|loremflickr\.com|fakeimg\.pl|placekitten\.com|placebear\.com|(?:i\.)?pravatar\.cc|randomuser\.me|robohash\.org|ui-avatars\.com)[^"']*)["']([^>]*?)\/?>/gi;

/**
 * Replace common placeholder image URLs with data-generate-image attributes,
 * using the alt text as the generation prompt.
 */
function replacePlaceholderUrls(html: string): string {
  PLACEHOLDER_URL_REGEX.lastIndex = 0;
  return html.replace(PLACEHOLDER_URL_REGEX, (fullMatch, before, _url, after) => {
    // Skip if already has data-generate-image
    if (fullMatch.includes("data-generate-image")) return fullMatch;

    const altMatch = (before + after).match(ALT_ATTR_REGEX);
    const prompt = altMatch?.[1] || "professional photograph for a modern website";

    // Determine ratio from dimensions in the URL or class hints
    const isSmall = /(?:w-(?:8|10|12|14|16)|h-(?:8|10|12|14|16)|rounded-full|avatar)/i.test(before + after);
    const ratio = isSmall ? "1:1" : "16:9";
    const style = isSmall ? "photo" : "photo";

    // Remove the src attribute, add data-generate-image
    const cleaned = (before + after).replace(/src=["'][^"']*["']\s*/gi, "");
    return `${cleaned} data-generate-image="${prompt}" data-image-style="${style}" data-image-ratio="${ratio}" />`;
  });
}

// Fallback SVG for failed image generation
const FALLBACK_SVG = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect fill="%23f3f4f6" width="800" height="450"/><text x="400" y="210" text-anchor="middle" fill="%239ca3af" font-family="system-ui,sans-serif" font-size="16">Image generation failed</text><text x="400" y="240" text-anchor="middle" fill="%23d1d5db" font-family="system-ui,sans-serif" font-size="13">Check GOOGLE_AI_API_KEY is configured</text></svg>')}`;

/**
 * Process all image placeholders in HTML, generating images and replacing
 * placeholder tags with real image URLs.
 */
export async function processImagePlaceholders(
  html: string,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  // First, convert any placeholder URLs to data-generate-image attributes
  const preprocessed = replacePlaceholderUrls(html);
  const placeholders = findPlaceholders(preprocessed);

  if (placeholders.length === 0) return { html, totalCount: 0, failedCount: 0, errors: [] };

  const concurrency = options.concurrency ?? 3;
  let result = preprocessed;
  let failedCount = 0;
  const errors: string[] = [];

  // Process in batches to respect concurrency limits
  for (let i = 0; i < placeholders.length; i += concurrency) {
    const batch = placeholders.slice(i, i + concurrency);

    const generated = await Promise.allSettled(
      batch.map((placeholder) =>
        generateImage({
          prompt: placeholder.prompt,
          style: placeholder.style,
          aspectRatio: placeholder.aspectRatio ?? "16:9",
          orgId: options.orgId,
          brandColours: options.brandColours,
          brandStyle: options.brandStyle,
          googleApiKey: options.googleApiKey,
        })
      )
    );

    for (let j = 0; j < batch.length; j++) {
      const placeholder = batch[j];
      const genResult = generated[j];

      if (genResult.status === "fulfilled") {
        const imageUrl = genResult.value.url;

        // Build replacement img tag with real src
        const replacement = placeholder.match
          .replace(/data-generate-image=["'][^"']*["']\s*/i, "")
          .replace(/data-image-style=["'][^"']*["']\s*/i, "")
          .replace(/data-image-ratio=["'][^"']*["']\s*/i, "")
          .replace(
            /src=["'][^"']*["']/i,
            `src="${imageUrl}"`
          )
          // If no src attribute exists, add one before the closing
          .replace(
            /\/?>$/,
            (closing) =>
              closing.includes("src=")
                ? closing
                : ` src="${imageUrl}" ${closing}`
          );

        // replaceAll handles duplicate identical prompts
        result = result.replaceAll(placeholder.match, replacement);
        options.onImageComplete?.(i + j, imageUrl);
      } else {
        failedCount++;
        const isSafetyBlock = genResult.reason instanceof ImageSafetyError;
        const errMsg = isSafetyBlock
          ? `Safety policy blocked "${placeholder.prompt}" — try a more abstract description`
          : genResult.reason instanceof Error
            ? genResult.reason.message
            : String(genResult.reason);
        errors.push(errMsg);

        // Replace with fallback image but KEEP data-generate-image for retry
        const fallback = placeholder.match
          .replace(
            /src=["'][^"']*["']/i,
            `src="${FALLBACK_SVG}"`
          )
          .replace(
            /\/?>$/,
            (closing) =>
              closing.includes("src=")
                ? closing
                : ` src="${FALLBACK_SVG}" ${closing}`
          );

        result = result.replaceAll(placeholder.match, fallback);
        console.warn(
          `[image-pipeline] Failed to generate image for "${placeholder.prompt}":`,
          errMsg
        );
      }
    }
  }

  return { html: result, totalCount: placeholders.length, failedCount, errors };
}

/**
 * Check if HTML contains any image placeholders that need processing.
 */
export function hasImagePlaceholders(html: string): boolean {
  PLACEHOLDER_REGEX.lastIndex = 0;
  return PLACEHOLDER_REGEX.test(html);
}

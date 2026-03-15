/**
 * Image pipeline — scans generated HTML for image placeholders and
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

import { generateImage, type ImageStyle, type AspectRatio } from "./generate";

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

/**
 * Process all image placeholders in HTML, generating images and replacing
 * placeholder tags with real image URLs.
 *
 * Returns the updated HTML with all placeholders resolved.
 */
export async function processImagePlaceholders(
  html: string,
  options: PipelineOptions = {}
): Promise<string> {
  const placeholders = findPlaceholders(html);

  if (placeholders.length === 0) return html;

  const concurrency = options.concurrency ?? 3;
  let result = html;

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

        result = result.replace(placeholder.match, replacement);
        options.onImageComplete?.(i + j, imageUrl);
      } else {
        // On failure, replace with a placeholder image
        const fallback = placeholder.match.replace(
          /data-generate-image=["'][^"']*["']\s*/i,
          ""
        );
        result = result.replace(placeholder.match, fallback);
        console.warn(
          `[image-pipeline] Failed to generate image for "${placeholder.prompt}":`,
          genResult.reason
        );
      }
    }
  }

  return result;
}

/**
 * Check if HTML contains any image placeholders that need processing.
 */
export function hasImagePlaceholders(html: string): boolean {
  PLACEHOLDER_REGEX.lastIndex = 0;
  return PLACEHOLDER_REGEX.test(html);
}

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
import { FALLBACK_SVG } from "./fallback";
import { resolveJsxImages, hasJsxImageExpressions } from "./resolve-jsx-images";

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
  /** Callback when an individual image fails */
  onImageError?: (index: number, error: string) => void;
  /** Callback when total image count is known */
  onTotalCount?: (count: number) => void;
  /** User-provided Google AI API key (BYOK) */
  googleApiKey?: string;
  /** Force regeneration even for images that already have real URLs */
  forceRegenerate?: boolean;
  /** AbortSignal — stops generation when client disconnects or cancels */
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// Corrupted URL repair — fixes URLs broken by the double-prefix bug
// ---------------------------------------------------------------------------

/**
 * Repair corrupted image URLs from a previous bug where replaceAll("/api/storage/", ...)
 * double-prefixed already-absolute URLs, producing:
 *   src="https://domhttps://dom/api/storage/..."
 * Also replaces bare filenames (no path) with SVG fallback so they can be re-generated.
 */
function repairCorruptedImageUrls(html: string): string {
  // Fix double-prefixed URLs: https://domhttps://dom/api/storage/... → keep last valid URL
  let result = html.replace(
    /src=(["'])(https?:\/\/[^"']*?)(https?:\/\/[^"']*\/api\/storage\/[^"']+)\1/gi,
    'src="$3"'
  );

  // Replace bare filenames (no path) on ANY <img> tag with SVG fallback.
  // If the tag has data-generate-image, the pipeline will re-generate it.
  // If not, add data-generate-image using the alt text so it becomes re-generable.
  result = result.replace(
    /(<img\s[^>]*?)src=(["'])(?!data:|https?:|\/)([^"'/\s]+\.(?:jpg|jpeg|png|webp|gif))\2([^>]*?)\/?>/gi,
    (_match, before, _q, _filename, after) => {
      const tag = before + after;
      const hasGenerateAttr = tag.includes("data-generate-image");
      const fallbackSrc = 'src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27/%3E"';

      if (hasGenerateAttr) {
        // Already has prompt — just fix the src
        return `${before}${fallbackSrc}${after} />`;
      }

      // No data-generate-image — add one from alt text or generic prompt
      const altMatch = tag.match(/alt=["']([^"']+)["']/i);
      const prompt = altMatch?.[1] || "professional photograph for a modern website";
      const isSmall = /(?:w-(?:8|10|12|14|16)|h-(?:8|10|12|14|16)|rounded-full|avatar)/i.test(tag);
      const ratio = isSmall ? "1:1" : "16:9";
      const style = isSmall ? "photo" : "photo";
      return `${before}${fallbackSrc} data-generate-image="${prompt}" data-image-style="${style}" data-image-ratio="${ratio}"${after} />`;
    }
  );

  return result;
}

// ---------------------------------------------------------------------------
// Placeholder detection
// ---------------------------------------------------------------------------

const PLACEHOLDER_REGEX =
  /(<img\s[^>]*?)data-generate-image\s*=\s*["']([^"']+)["']([^>]*?)\/?>/gi;

const STYLE_ATTR_REGEX = /data-image-style=["']([^"']+)["']/i;
const RATIO_ATTR_REGEX = /data-image-ratio=["']([^"']+)["']/i;
const ALT_ATTR_REGEX = /alt=["']([^"']+)["']/i;

const SRC_ATTR_REGEX = /src=["']([^"']+)["']/i;

export function findPlaceholders(
  html: string,
  options?: { skipAlreadyGenerated?: boolean }
): ImagePlaceholder[] {
  const placeholders: ImagePlaceholder[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  PLACEHOLDER_REGEX.lastIndex = 0;

  while ((match = PLACEHOLDER_REGEX.exec(html)) !== null) {
    const fullMatch = match[0];
    const prompt = match[2];
    const fullTag = match[1] + match[3];

    // Skip images that already have a valid (non-fallback, non-corrupted) src URL
    if (options?.skipAlreadyGenerated) {
      const srcMatch = fullMatch.match(SRC_ATTR_REGEX);
      if (srcMatch) {
        const src = srcMatch[1];
        const isFallbackSvg = src.startsWith("data:image/svg+xml");
        const isBareFilename = !src.includes("/") && /\.\w+$/.test(src);
        const isDoublePrefix = /https?:\/\/.*https?:\/\//.test(src);
        // Only skip if the URL looks valid — re-generate broken ones
        if (!isFallbackSvg && !isBareFilename && !isDoublePrefix) {
          continue;
        }
      }
    }

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
// Avatar div/span conversion — catches cases where the AI uses initials
// instead of <img data-generate-image> tags for avatars
// ---------------------------------------------------------------------------

/**
 * Match <div className="...rounded-full...">{initials}</div> or with inner <span>.
 * Also matches <span className="...rounded-full...">{initials}</span>.
 * Captures: (1) tag+attrs, (2) initials text, (3) size classes for reuse.
 */
// Captures any 1-20 non-whitespace, non-angle-bracket character sequence as the
// "initials" slot. Previously this was `[A-Za-z]{1,5}`, which silently skipped
// emoji ("😊"), non-Latin names ("李明"), mixed alphanumerics ("JD1"), and any
// first name longer than five letters — those divs rendered as empty circles.
const AVATAR_INITIALS_RE =
  /<(div|span)\s([^>]*?className=["'][^"']*rounded-full[^"']*["'][^>]*)>(?:\s*<span[^>]*>)?\s*([^\s<>]{1,20})\s*(?:<\/span>\s*)?<\/\1>/gi;

/**
 * Convert avatar placeholders using initials (e.g. <div className="...rounded-full...">SC</div>)
 * into proper <img data-generate-image> tags so the image pipeline can process them.
 *
 * A position counter is appended to each prompt so that multiple avatars
 * sharing the same initials (e.g. two "AA"s for Alex Adams + Amy Anderson)
 * generate distinct images rather than collapsing to a single deduped URL.
 */
export function convertAvatarDivsToImgs(html: string): string {
  AVATAR_INITIALS_RE.lastIndex = 0;
  let counter = 0;
  return html.replace(AVATAR_INITIALS_RE, (_fullMatch, _tag, attrs, initials) => {
    counter += 1;
    const classMatch = attrs.match(/className=["']([^"']+)["']/i);
    const classes = classMatch?.[1] ?? "w-10 h-10 rounded-full object-cover";
    const imgClasses = classes.includes("object-cover") ? classes : `${classes} object-cover`;
    const cleanedClasses = imgClasses
      .replace(/\b(?:flex|inline-flex|items-center|justify-center|text-(?:xs|sm|base|lg|xl|\[[\d.]+\w+\])|font-\w+|bg-\[[^\]]+\]|bg-\w+-\d+)\b/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    return `<img data-generate-image="professional headshot portrait of person #${counter}, ${initials}" data-image-style="photo" data-image-ratio="1:1" alt="${initials}" className="${cleanedClasses}" />`;
  });
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

// ---------------------------------------------------------------------------
// Relative path replacement — catches fake paths like /avatars/alex.jpg
// ---------------------------------------------------------------------------

const RELATIVE_SRC_REGEX =
  /(<img\s[^>]*?)src=["'](\/[^"'\s>]+)["']([^>]*?)\/?>/gi;

/**
 * Replace relative src paths (e.g. /images/hero.jpg) with data-generate-image
 * attributes. AI models generate these fake paths; they need real images.
 */
function replaceRelativeSrcUrls(html: string): string {
  RELATIVE_SRC_REGEX.lastIndex = 0;
  return html.replace(RELATIVE_SRC_REGEX, (fullMatch, before, _url, after) => {
    if (fullMatch.includes("data-generate-image")) return fullMatch;

    const altMatch = (before + after).match(ALT_ATTR_REGEX);
    const prompt = altMatch?.[1] || "professional photograph for a modern website";

    const isSmall = /(?:w-(?:8|10|12|14|16)|h-(?:8|10|12|14|16)|rounded-full|avatar)/i.test(before + after);
    const ratio = isSmall ? "1:1" : "16:9";
    const style = isSmall ? "photo" : "photo";

    const cleaned = (before + after).replace(/src=["'][^"']*["']\s*/gi, "");
    return `${cleaned} data-generate-image="${prompt}" data-image-style="${style}" data-image-ratio="${ratio}" />`;
  });
}

// Fallback SVG lives in lib/image/fallback.ts so the JSX resolver shares it.

/**
 * Process all image placeholders in HTML, generating images and replacing
 * placeholder tags with real image URLs.
 */
export async function processImagePlaceholders(
  html: string,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  // Phase 1: Resolve JSX expression-based data-generate-image attrs (e.g. {member.prompt})
  // This must run BEFORE the literal-string pipeline since it modifies the source code
  let jsxCount = 0;
  let jsxFailed = 0;
  const jsxErrors: string[] = [];
  let working = html;

  if (hasJsxImageExpressions(html)) {
    const jsxResult = await resolveJsxImages(html, options);
    working = jsxResult.code;
    jsxCount = jsxResult.count;
    jsxFailed = jsxResult.failedCount;
    jsxErrors.push(...jsxResult.errors);
  }

  // Phase 2: Repair corrupted URLs from previous bugs, then convert placeholders
  const repaired = repairCorruptedImageUrls(working);
  const preprocessed = replaceRelativeSrcUrls(replacePlaceholderUrls(convertAvatarDivsToImgs(repaired)));
  const placeholders = findPlaceholders(preprocessed, {
    skipAlreadyGenerated: !options.forceRegenerate,
  });

  if (placeholders.length === 0 && jsxCount === 0) return { html: working, totalCount: 0, failedCount: 0, errors: [] };
  if (placeholders.length === 0) return { html: working, totalCount: jsxCount, failedCount: jsxFailed, errors: jsxErrors };

  // Deduplicate by match string — generate once, replaceAll handles all occurrences
  const uniquePlaceholders = placeholders.filter(
    (p, i, arr) => arr.findIndex((q) => q.match === p.match) === i
  );

  // Report total count for progress tracking
  options.onTotalCount?.(uniquePlaceholders.length + jsxCount);

  const concurrency = options.concurrency ?? 3;
  let result = preprocessed;
  let failedCount = 0;
  const errors: string[] = [];

  // Process in batches to respect concurrency limits
  for (let i = 0; i < uniquePlaceholders.length; i += concurrency) {
    // Stop if client disconnected or request was cancelled
    if (options.signal?.aborted) {
      console.log("[image-pipeline] Aborted — client disconnected or cancelled");
      break;
    }

    const batch = uniquePlaceholders.slice(i, i + concurrency);

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

        // Keep data-generate-image so "Regenerate images" can re-process later.
        // Strip ALL existing src attributes (prevents duplicates in JSX where last wins)
        // then add a single clean src with the real URL.
        const stripped = placeholder.match
          .replace(/\ssrc\s*=\s*"[^"]*"/gi, "")
          .replace(/\ssrc\s*=\s*'[^']*'/gi, "")
          .replace(/\ssrc\s*=\s*\{[^}]*\}/gi, "");
        const replacement = stripped.replace(
          /\/?\s*>$/,
          ` src="${imageUrl}" />`
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
        // Strip ALL existing src attributes to prevent duplicates
        const fallbackStripped = placeholder.match
          .replace(/\ssrc\s*=\s*"[^"]*"/gi, "")
          .replace(/\ssrc\s*=\s*'[^']*'/gi, "")
          .replace(/\ssrc\s*=\s*\{[^}]*\}/gi, "");
        const fallback = fallbackStripped.replace(
          /\/?\s*>$/,
          ` src="${FALLBACK_SVG}" />`
        );

        result = result.replaceAll(placeholder.match, fallback);
        options.onImageError?.(i + j, errMsg);
        console.warn(
          `[image-pipeline] Failed to generate image for "${placeholder.prompt}":`,
          errMsg
        );
      }
    }
  }

  return {
    html: result,
    totalCount: placeholders.length + jsxCount,
    failedCount: failedCount + jsxFailed,
    errors: [...jsxErrors, ...errors],
  };
}

/**
 * Check if HTML contains any image placeholders that need processing.
 */
export function hasImagePlaceholders(html: string): boolean {
  PLACEHOLDER_REGEX.lastIndex = 0;
  return PLACEHOLDER_REGEX.test(html) || hasJsxImageExpressions(html);
}

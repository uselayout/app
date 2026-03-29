/**
 * Placeholder SVG generator for ungenerated images.
 *
 * Creates styled data-URI SVGs that show the image prompt text
 * and a camera icon, maintaining the correct aspect ratio.
 */

// ---------------------------------------------------------------------------
// Aspect ratio dimensions
// ---------------------------------------------------------------------------

const RATIO_DIMENSIONS: Record<string, { w: number; h: number }> = {
  "1:1": { w: 400, h: 400 },
  "16:9": { w: 800, h: 450 },
  "9:16": { w: 450, h: 800 },
  "4:3": { w: 800, h: 600 },
  "3:4": { w: 600, h: 800 },
  "3:2": { w: 750, h: 500 },
  "21:9": { w: 840, h: 360 },
};

// ---------------------------------------------------------------------------
// SVG generation
// ---------------------------------------------------------------------------

/**
 * Generate a placeholder SVG data URI for an ungenerated image.
 */
export function createPlaceholderSvg(
  prompt: string,
  ratio: string = "16:9",
): string {
  const dims = RATIO_DIMENSIONS[ratio] ?? RATIO_DIMENSIONS["16:9"];
  const { w, h } = dims;

  // Truncate prompt for display
  const maxLen = 60;
  const displayPrompt = prompt.length > maxLen
    ? prompt.slice(0, maxLen - 3) + "..."
    : prompt;

  // Escape XML entities
  const escaped = displayPrompt
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const cx = w / 2;
  const cy = h / 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect fill="#2A2A32" width="${w}" height="${h}"/>
  <g transform="translate(${cx},${cy - 16})">
    <path d="M-12,-8 L12,-8 L12,8 L-12,8 Z" fill="none" stroke="#555" stroke-width="1.5" rx="2"/>
    <circle cx="0" cy="0" r="4" fill="none" stroke="#555" stroke-width="1.5"/>
    <rect x="-6" y="-11" width="6" height="3" rx="1" fill="#555"/>
  </g>
  <text x="${cx}" y="${cy + 20}" text-anchor="middle" fill="#666" font-family="system-ui,sans-serif" font-size="12">${escaped}</text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ---------------------------------------------------------------------------
// Placeholder injection
// ---------------------------------------------------------------------------

/** Regex for data-generate-image with literal string values (no src yet or placeholder src) */
const IMG_WITH_GENERATE_RE =
  /(<img\s[^>]*?)data-generate-image\s*=\s*["']([^"']+)["']([^>]*?)\/?>/gi;

/** Regex for JSX expression data-generate-image */
const IMG_WITH_JSX_GENERATE_RE =
  /(<img\s[^>]*?)data-generate-image=\{([^}]+)\}([^>]*?)\/?>/gi;

/**
 * Inject placeholder SVGs into all <img data-generate-image> tags that
 * don't already have a real src URL.
 *
 * Returns the updated code and count of placeholders injected.
 */
export function injectPlaceholderSvgs(code: string): { code: string; count: number } {
  let count = 0;

  // Handle literal string data-generate-image="..."
  IMG_WITH_GENERATE_RE.lastIndex = 0;
  let result = code.replace(IMG_WITH_GENERATE_RE, (fullMatch, before: string, prompt: string, after: string) => {
    const combined = before + after;
    // Skip if already has a real (non-placeholder, non-fallback) src
    const srcMatch = combined.match(/src=["']([^"']+)["']/);
    if (srcMatch && !srcMatch[1].startsWith("data:image/svg+xml")) {
      return fullMatch;
    }

    // Extract ratio from data-image-ratio if present
    const ratioMatch = combined.match(/data-image-ratio=["']([^"']+)["']/);
    const ratio = ratioMatch?.[1] ?? "16:9";

    const placeholder = createPlaceholderSvg(prompt, ratio);
    count++;

    // Replace or add src
    if (srcMatch) {
      const updated = fullMatch.replace(/src=["'][^"']*["']/, `src="${placeholder}"`);
      return updated;
    }
    return `${before}src="${placeholder}" data-generate-image="${prompt}"${after} />`;
  });

  // Handle JSX expression data-generate-image={...}
  // For these we can't resolve the prompt, so use a generic placeholder
  IMG_WITH_JSX_GENERATE_RE.lastIndex = 0;
  result = result.replace(IMG_WITH_JSX_GENERATE_RE, (fullMatch, before: string, _expr: string, after: string) => {
    const combined = before + after;
    const srcMatch = combined.match(/src=["']([^"']+)["']/);
    if (srcMatch && !srcMatch[1].startsWith("data:image/svg+xml")) {
      return fullMatch;
    }
    // JSX expressions also checked for src={...}
    if (/src=\{/.test(combined)) {
      return fullMatch;
    }

    const ratioMatch = combined.match(/data-image-ratio=["']([^"']+)["']/);
    const ratio = ratioMatch?.[1] ?? "16:9";
    const placeholder = createPlaceholderSvg("Image ready to generate", ratio);
    count++;

    if (srcMatch) {
      return fullMatch.replace(/src=["'][^"']*["']/, `src="${placeholder}"`);
    }
    // No src attribute — add one before the closing tag
    const exprWithBraces = `{${_expr}}`;
    return `${before}src="${placeholder}" data-generate-image=${exprWithBraces}${after} />`;
  });

  return { code: result, count };
}

/**
 * Count how many images in the code still have placeholder SVGs (not yet generated).
 */
export function countPlaceholderImages(code: string): number {
  const matches = code.match(/src="data:image\/svg\+xml,%3Csvg/gi);
  return matches?.length ?? 0;
}

/**
 * Check if an image src is a placeholder (not a real generated image).
 */
export function isPlaceholderSrc(src: string): boolean {
  return src.startsWith("data:image/svg+xml,") && src.includes("%232A2A32");
}

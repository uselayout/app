import type { BrandingAsset, BrandingSlot, BrandingVariant } from "@/lib/types";

const BRAND_LOGO_IMG_RE =
  /<img\s[^>]*data-brand-logo=(?:["']([^"']+)["']|\{["']([^"']+)["']\})[^>]*\/?>/gi;
const BRAND_VARIANT_ATTR_RE =
  /data-brand-variant=(?:["']([^"']+)["']|\{["']([^"']+)["']\})/i;

/**
 * Resolve the best asset for a requested slot + variant.
 *
 * Precedence:
 *   1. Exact match (same slot, same variant)
 *   2. Same slot, variant "colour" (the default fallback)
 *   3. Same slot, any variant
 *   4. Primary / wordmark / mark in order with any variant
 *   5. Any asset
 *   6. Null when the project has no branding uploads
 */
function resolveAsset(
  slotRaw: string,
  variantRaw: string,
  assets: BrandingAsset[]
): BrandingAsset | null {
  if (assets.length === 0) return null;

  const slot = slotRaw.trim().toLowerCase() as BrandingSlot;
  const variant = variantRaw.trim().toLowerCase() as BrandingVariant;

  const sameSlot = assets.filter((a) => a.slot === slot);
  const exact = sameSlot.find((a) => (a.variant ?? "colour") === variant);
  if (exact) return exact;

  const fallbackColour = sameSlot.find(
    (a) => (a.variant ?? "colour") === "colour"
  );
  if (fallbackColour) return fallbackColour;
  if (sameSlot[0]) return sameSlot[0];

  for (const fallbackSlot of ["primary", "wordmark", "mark"] as const) {
    const candidate = assets.find((a) => a.slot === fallbackSlot);
    if (candidate) return candidate;
  }
  return assets[0] ?? null;
}

/**
 * Replace `data-brand-logo="primary|secondary|wordmark|favicon|mark|other"`
 * attributes in generated code with the real Supabase URL for that slot.
 *
 * The attribute stays on the element so a later regenerate can re-resolve it.
 * ALL existing src attributes are stripped first — mirrors the
 * data-generate-image pipeline at lib/image/pipeline.ts:352-354 and the JSX
 * duplicate-attribute gotcha documented in CLAUDE.md.
 */
export function replaceBrandingPlaceholders(
  code: string,
  assets: BrandingAsset[] | undefined | null
): string {
  if (!assets || assets.length === 0) return code;
  if (!code.includes("data-brand-logo")) return code;

  return code.replace(BRAND_LOGO_IMG_RE, (match, quotedSlot, exprSlot) => {
    const slotRaw = quotedSlot ?? exprSlot ?? "primary";
    const variantMatch = match.match(BRAND_VARIANT_ATTR_RE);
    const variantRaw =
      (variantMatch?.[1] ?? variantMatch?.[2] ?? "colour").trim();

    const asset = resolveAsset(slotRaw, variantRaw, assets);
    if (!asset) return match;

    // Strip every existing src variant before adding a single clean one.
    // Without this, JSX "last-src-wins" can leave the fallback visible.
    const stripped = match
      .replace(/\ssrc\s*=\s*"[^"]*"/gi, "")
      .replace(/\ssrc\s*=\s*'[^']*'/gi, "")
      .replace(/\ssrc\s*=\s*\{[^}]*\}/gi, "");

    return stripped.replace(/\/?\s*>$/, ` src="${asset.url}" />`);
  });
}

/** Quick check — skip the pipeline when the code has no branding placeholders. */
export function hasBrandingPlaceholders(code: string): boolean {
  return /data-brand-logo=/.test(code);
}

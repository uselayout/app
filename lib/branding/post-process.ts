import type { BrandingAsset, BrandingSlot } from "@/lib/types";

const BRAND_LOGO_ATTR_RE = /data-brand-logo=(?:["']([^"']+)["']|\{["']([^"']+)["']\})/;
const BRAND_LOGO_IMG_RE = /<img\s[^>]*data-brand-logo=(?:["']([^"']+)["']|\{["']([^"']+)["']\})[^>]*\/?>/gi;

type AssetMap = Partial<Record<BrandingSlot, BrandingAsset>>;

function buildSlotMap(assets: BrandingAsset[]): AssetMap {
  const map: AssetMap = {};
  // Later uploads win on duplicate slot assignment.
  for (const asset of assets) {
    map[asset.slot] = asset;
  }
  return map;
}

/**
 * Resolve the asset for a given slot. Falls back to "primary" when the
 * requested slot is unassigned, to "any" asset as a last resort, or null
 * when the project has no branding assets at all.
 */
function resolveAsset(
  slot: string,
  map: AssetMap,
  assets: BrandingAsset[]
): BrandingAsset | null {
  const normalised = slot.trim().toLowerCase() as BrandingSlot;
  return (
    map[normalised] ??
    map.primary ??
    map.wordmark ??
    map.mark ??
    assets[0] ??
    null
  );
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

  const map = buildSlotMap(assets);

  return code.replace(BRAND_LOGO_IMG_RE, (match, quotedSlot, exprSlot) => {
    const slotRaw = quotedSlot ?? exprSlot ?? "primary";
    const asset = resolveAsset(slotRaw, map, assets);
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
  return BRAND_LOGO_ATTR_RE.test(code);
}

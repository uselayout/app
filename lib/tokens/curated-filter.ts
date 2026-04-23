/**
 * Decide whether a token name is part of the "curated" canonical design
 * system, or whether it's noise from vendor prefixes / computed-style
 * firehose / framework internals. The divergence banner defaults to
 * showing only curated tokens; users opt into the full list via a toggle.
 */

/**
 * Prefixes emitted by third-party CSS frameworks or site-specific
 * internals. Not portable; not useful to an AI coding agent. Reject.
 */
const VENDOR_PREFIXES = [
  "mw-",
  "eds-",
  "fides-",
  "chakra-",
  "ant-",
  "mui-",
  "radix-",
  "shadcn-",
  "navigation-",
  "coin-",
  "coins-",
  "nav-",
  "btn-",
  "input-",
  "dropdown-",
  "modal-",
  "card-",
];

/**
 * Canonical design-token prefixes. A token whose stripped name starts
 * with one of these is considered curated. List is intentionally broad
 * so the filter catches reasonable names across sites without a
 * standardisation pass.
 */
const CANONICAL_PREFIXES = [
  // Colour
  "color-",
  "bg-",
  "background-",
  "text-",
  "border-",
  "outline-",
  "ring-",
  "stroke-",
  "fill-",
  // Typography
  "font-",
  "font-family-",
  "font-size-",
  "font-weight-",
  "line-height-",
  "letter-spacing-",
  "tracking-",
  "leading-",
  // Spacing / sizing
  "space-",
  "spacing-",
  "gap-",
  "padding-",
  "margin-",
  "inset-",
  "size-",
  // Shape
  "radius-",
  "rounded-",
  // Effects
  "shadow-",
  "elevation-",
  "opacity-",
  "blur-",
  // Motion
  "duration-",
  "ease-",
  "transition-",
  "animation-",
  "motion-",
  // Layers
  "z-",
  "zindex-",
  "z-index-",
];

/**
 * Returns true if the token name looks like a member of a canonical
 * design system (worth surfacing in the divergence banner), false if
 * it looks like vendor / framework / computed-style noise.
 */
export function isCuratedTokenName(name: string): boolean {
  const stripped = name.replace(/^--/, "").toLowerCase();

  // Vendor or framework-scoped tokens: always noise.
  for (const prefix of VENDOR_PREFIXES) {
    if (stripped.startsWith(prefix)) return false;
  }

  // Pure numeric size / font-size scales with no semantic slot name
  // (e.g. size-112, size-146, font-size-48) — extraction noise.
  if (/^(?:size|font-size|line-height|letter-spacing|space|padding|margin|gap|inset|radius)-\d+(?:\.\d+)?$/.test(stripped)) {
    return false;
  }

  // Canonical prefix — curated.
  for (const prefix of CANONICAL_PREFIXES) {
    if (stripped.startsWith(prefix)) return true;
  }

  // Single-word brand-style names (e.g. `coral`, `midnight`) — curated.
  if (!stripped.includes("-") && stripped.length >= 3 && stripped.length <= 12) {
    return true;
  }

  return false;
}

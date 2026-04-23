/**
 * Pre-extraction noise filter. Identifies third-party vendor tokens
 * (consent banners, analytics, support widgets) and alpha-tint primitive
 * patterns that dominate the unassigned list with no real design-system
 * value. Called by the Figma and Website extractors just before returning
 * their ExtractionResult.
 *
 * Dropped tokens are returned separately in `ExtractionResult.droppedNoise`
 * so users can still see what was filtered and re-include anything they
 * genuinely want.
 */

/**
 * Third-party library / consent / analytics / widget prefixes that flood
 * extraction output but are never part of the user's own design system.
 * Matched case-insensitively against the token name (with leading `--`
 * stripped).
 */
const VENDOR_PREFIXES: readonly string[] = [
  "fides-",
  "onetrust-",
  "cookiebot-",
  "iubenda-",
  "usercentrics-",
  "didomi-",
  "klaro-",
  "cky-",
  "hotjar-",
  "intercom-",
  "drift-",
  "zendesk-",
  "fullstory-",
  "pendo-",
  "amplitude-",
  "segment-",
  "mixpanel-",
  "crisp-",
  "helpscout-",
  "tidio-",
  "freshchat-",
  "livechat-",
  "olark-",
];

/**
 * Value patterns that are almost always alpha-tint primitives (not semantic
 * tokens). These dominate the unassigned list on any project that imports a
 * full design system primitive layer.
 */
const VALUE_NOISE_PATTERNS: readonly RegExp[] = [
  // rgba(var(--white-rgb), 0.5) / rgba(var(--black-rgb), .25)
  /^rgba\(\s*var\(\s*--[\w-]*(?:white|black|gray|grey|neutral|slate|zinc|stone)-rgb\s*\)\s*,/i,
];

/**
 * Name patterns that signal a numeric-tint primitive with no semantic role
 * (e.g. `--white-0`, `--black-100`, `--gray-950`). Kept deliberately tight
 * so custom semantic tokens like `--accent-100` aren't caught.
 */
const NAME_NOISE_PATTERNS: readonly RegExp[] = [
  /^--?(?:white|black|gray|grey|neutral|slate|zinc|stone)-\d{1,4}$/i,
];

function stripPrefixMarker(name: string): string {
  return name.replace(/^--/, "").toLowerCase();
}

/**
 * Decide whether a token should be dropped from extraction. Pure function —
 * stateless and safe to call in hot loops.
 */
export function isNoiseToken(name: string, value: string): boolean {
  const normalised = stripPrefixMarker(name);

  for (const prefix of VENDOR_PREFIXES) {
    if (normalised.startsWith(prefix)) return true;
    // Some CSS libs also emit them mid-name (e.g. `--app-fides-overlay`).
    if (normalised.includes(`-${prefix}`)) return true;
  }

  for (const re of NAME_NOISE_PATTERNS) {
    if (re.test(name) || re.test(`--${normalised}`)) return true;
  }

  for (const re of VALUE_NOISE_PATTERNS) {
    if (re.test(value)) return true;
  }

  return false;
}

/**
 * Partition a list of tokens into kept vs dropped. Works for any object
 * shape that has `name` and `value` string fields.
 */
export function partitionNoise<T extends { name: string; value: string }>(
  tokens: T[]
): { kept: T[]; dropped: T[] } {
  const kept: T[] = [];
  const dropped: T[] = [];
  for (const t of tokens) {
    if (isNoiseToken(t.name, t.value)) dropped.push(t);
    else kept.push(t);
  }
  return { kept, dropped };
}

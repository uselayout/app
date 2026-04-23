import type { ExtractedToken } from "@/lib/types";

/**
 * Score a token name for "best to keep" when collapsing duplicates by value.
 * Higher is better. Semantic names beat primitive names; shorter beats
 * longer when otherwise tied.
 */
function nameQualityScore(token: ExtractedToken): number {
  let score = 0;
  const name = (token.cssVariable ?? token.name).toLowerCase();

  // Strongly prefer semantic category
  if (token.category === "semantic") score += 20;

  // Reward semantic-sounding names
  const semanticHints = [
    "primary",
    "secondary",
    "accent",
    "brand",
    "surface",
    "background",
    "text",
    "border",
    "error",
    "warning",
    "success",
    "info",
    "focus",
    "hover",
    "active",
    "disabled",
    "muted",
    "subtle",
    "strong",
    "on-",
  ];
  for (const hint of semanticHints) {
    if (name.includes(hint)) score += 5;
  }

  // Penalise primitive-looking names (numeric suffix, raw-colour words)
  if (/-(\d{1,4})$/.test(name)) score -= 10;
  if (/(white|black|gray|grey|neutral|slate|zinc|stone)-\d/.test(name)) score -= 5;

  // All else equal, shorter names are better (penalty = name length)
  score -= Math.floor(name.length / 8);

  return score;
}

/**
 * Normalise a value for equality comparison. Lowercases hex, strips
 * whitespace. Values outside recognised shapes are compared verbatim.
 */
function normaliseValue(type: ExtractedToken["type"], value: string): string {
  const v = value.trim();
  if (type === "color") {
    // Lowercase hex, expand 3-digit to 6-digit
    const m = v.match(/^#([0-9a-fA-F]{3,8})\b/);
    if (m) {
      const h = m[1].toLowerCase();
      if (h.length === 3) {
        return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
      }
      return `#${h}`;
    }
    return v.toLowerCase();
  }
  return v;
}

/**
 * Collapse tokens that share `(type, normalised value)` into a single kept
 * token with the best name; the losers are recorded on the kept token's new
 * `aliases` field (extension to ExtractedToken via intersection — callers
 * that don't know about `aliases` safely ignore it).
 *
 * Two tokens with identical values but different types stay separate (e.g.
 * a spacing `16px` and a radius `16px`).
 */
export function dedupeTokensByValue<T extends ExtractedToken>(
  tokens: T[]
): T[] {
  const groups = new Map<string, T[]>();
  for (const t of tokens) {
    const key = `${t.type}::${normaliseValue(t.type, t.value)}::${t.mode ?? ""}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(t);
    else groups.set(key, [t]);
  }

  const out: T[] = [];
  for (const bucket of groups.values()) {
    if (bucket.length === 1) {
      out.push(bucket[0]);
      continue;
    }
    // Rank and keep the best-named token.
    const ranked = [...bucket].sort(
      (a, b) => nameQualityScore(b) - nameQualityScore(a)
    );
    const kept = ranked[0];
    const aliases = ranked
      .slice(1)
      .map((t) => t.cssVariable ?? `--${t.name}`)
      .filter((a, i, arr) => a && arr.indexOf(a) === i);
    out.push({
      ...kept,
      aliases: [
        ...((kept as ExtractedToken & { aliases?: string[] }).aliases ?? []),
        ...aliases,
      ],
    } as T);
  }

  return out;
}

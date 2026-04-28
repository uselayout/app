import type { ExtractedToken, TokenType } from "@/lib/types";

/**
 * Pick a representative set of values from a census by frequency and value
 * spread. Returns the top-N most-used values, sorted by numeric magnitude
 * when possible. Used by the website extractor to turn raw computed-style
 * censuses into a structured scale (xs → 3xl).
 */
function pickRepresentativeValues(
  values: Record<string, { count: number; samples?: Array<{ tag: string; cls?: string; text?: string }> }>,
  maxItems: number
): Array<{ value: string; count: number; samples: Array<{ tag: string; cls?: string; text?: string }> }> {
  const entries = Object.entries(values).map(([value, info]) => ({
    value,
    count: info.count,
    samples: info.samples ?? [],
  }));
  if (entries.length === 0) return [];

  // Sort by count desc to pick the most-used values first.
  entries.sort((a, b) => b.count - a.count);
  const picked = entries.slice(0, maxItems);

  // Re-sort by numeric magnitude if possible so scale names line up.
  picked.sort((a, b) => {
    const na = parseFloat(a.value);
    const nb = parseFloat(b.value);
    if (isFinite(na) && isFinite(nb)) return na - nb;
    return a.value.localeCompare(b.value);
  });

  return picked;
}

type CensusBucket = Record<string, { count: number; samples?: Array<{ tag: string; cls?: string; text?: string }> }>;

function describeSamples(samples: Array<{ tag: string; cls?: string; text?: string }>, count: number): string {
  const seen = samples
    .slice(0, 3)
    .map((s) => {
      const text = s.text ? ` "${s.text.slice(0, 20)}"` : "";
      const cls = s.cls ? ` .${s.cls.split(/\s+/)[0]}` : "";
      return `${s.tag}${cls}${text}`.trim();
    })
    .filter(Boolean);
  const preview = seen.length > 0 ? ` — e.g. ${seen.join(", ")}` : "";
  return `${count} element${count === 1 ? "" : "s"}${preview} /* mined from computed styles */`;
}

/**
 * Convert a typography census into ExtractedToken arrays for sizes, weights,
 * and line-heights. Uses fixed scale-role names matching the design-system
 * schema (font-size-xs … font-size-3xl, font-weight-regular/medium/semibold/
 * bold, line-height-tight/normal/loose).
 */
export function buildTypographyTokensFromCensus(census: {
  sizes?: CensusBucket;
  weights?: CensusBucket;
  lineHeights?: CensusBucket;
  letterSpacings?: CensusBucket;
}): ExtractedToken[] {
  const out: ExtractedToken[] = [];

  // Font sizes: map sorted distinct values to size roles.
  const sizeRoles = ["font-size-xs", "font-size-sm", "font-size-md", "font-size-lg", "font-size-xl", "font-size-2xl", "font-size-3xl"];
  const sizes = pickRepresentativeValues(census.sizes ?? {}, sizeRoles.length);
  for (let i = 0; i < sizes.length; i++) {
    const { value, count, samples } = sizes[i];
    const roleName = sizeRoles[i];
    out.push({
      name: roleName,
      value,
      type: "typography",
      category: "primitive",
      cssVariable: `--${roleName}`,
      originalName: `${value} (computed census)`,
      description: describeSamples(samples, count),
    });
  }

  // Font weights: keep up to 4 distinct values as role slots.
  const weightRoles = ["font-weight-regular", "font-weight-medium", "font-weight-semibold", "font-weight-bold"];
  const weights = pickRepresentativeValues(census.weights ?? {}, weightRoles.length);
  for (let i = 0; i < weights.length; i++) {
    const { value, count, samples } = weights[i];
    const roleName = weightRoles[i];
    out.push({
      name: roleName,
      value,
      type: "typography",
      category: "primitive",
      cssVariable: `--${roleName}`,
      originalName: `${value} (computed census)`,
      description: describeSamples(samples, count),
    });
  }

  // Line-heights: 3 distinct values → tight / normal / loose.
  const lineHeightRoles = ["line-height-tight", "line-height-normal", "line-height-loose"];
  const lineHeights = pickRepresentativeValues(census.lineHeights ?? {}, lineHeightRoles.length);
  for (let i = 0; i < lineHeights.length; i++) {
    const { value, count, samples } = lineHeights[i];
    const roleName = lineHeightRoles[i];
    out.push({
      name: roleName,
      value,
      type: "typography",
      category: "primitive",
      cssVariable: `--${roleName}`,
      originalName: `${value} (computed census)`,
      description: describeSamples(samples, count),
    });
  }

  return out;
}

/**
 * Convert a spacing census into space-xs … space-3xl tokens sorted by px.
 */
export function buildSpacingTokensFromCensus(census: CensusBucket): ExtractedToken[] {
  const roles = ["space-xs", "space-sm", "space-md", "space-lg", "space-xl", "space-2xl", "space-3xl"];
  const picked = pickRepresentativeValues(census, roles.length);
  return picked.map(({ value, count, samples }, i) => ({
    name: roles[i],
    value,
    type: "spacing" as TokenType,
    category: "primitive" as const,
    cssVariable: `--${roles[i]}`,
    originalName: `${value} (computed census)`,
    description: describeSamples(samples, count),
  }));
}

/**
 * Convert a radius census into radius-sm / md / lg / full tokens sorted by px.
 * Augments, rather than replaces, any radius tokens the extractor found in
 * CSS custom properties.
 */
export function buildRadiusTokensFromCensus(census: CensusBucket, alreadyPresent: ExtractedToken[]): ExtractedToken[] {
  const seen = new Set(alreadyPresent.map((t) => t.value.trim()));
  const roles = ["radius-sm", "radius-md", "radius-lg", "radius-full"];
  const picked = pickRepresentativeValues(census, 8).filter((p) => !seen.has(p.value.trim()));
  return picked.slice(0, roles.length).map(({ value, count, samples }, i) => ({
    name: roles[i],
    value,
    type: "radius" as TokenType,
    category: "primitive" as const,
    cssVariable: `--${roles[i]}`,
    originalName: `${value} (computed census)`,
    description: describeSamples(samples, count),
  }));
}

/**
 * Convert a shadow census into shadow-sm / md / lg tokens ordered by
 * approximate elevation (total blur + y-offset).
 */
export function buildShadowTokensFromCensus(census: CensusBucket): ExtractedToken[] {
  const roles = ["shadow-sm", "shadow-md", "shadow-lg"];
  const picked = pickRepresentativeValues(census, roles.length);
  // Re-sort by "weight" — sum of numeric px-ish tokens inside the shadow string.
  picked.sort((a, b) => {
    const weight = (v: string) =>
      (v.match(/-?\d+(?:\.\d+)?\s*px/g) ?? [])
        .slice(0, 4)
        .reduce((sum, tok) => sum + Math.abs(parseFloat(tok)), 0);
    return weight(a.value) - weight(b.value);
  });
  return picked.map(({ value, count, samples }, i) => ({
    name: roles[i],
    value,
    type: "effect" as TokenType,
    category: "primitive" as const,
    cssVariable: `--${roles[i]}`,
    originalName: `${value.slice(0, 30)}… (computed census)`,
    description: describeSamples(samples, count),
  }));
}

/**
 * Convert a motion census into duration + easing tokens.
 */
export function buildMotionTokensFromCensus(census: {
  durations?: CensusBucket;
  easings?: CensusBucket;
}): ExtractedToken[] {
  const out: ExtractedToken[] = [];

  const durationRoles = ["duration-fast", "duration-base", "duration-slow"];
  const durations = pickRepresentativeValues(census.durations ?? {}, durationRoles.length);
  for (let i = 0; i < durations.length; i++) {
    const { value, count, samples } = durations[i];
    const roleName = durationRoles[i];
    out.push({
      name: roleName,
      value,
      type: "motion" as TokenType,
      category: "primitive" as const,
      cssVariable: `--${roleName}`,
      originalName: `${value} (computed census)`,
      description: describeSamples(samples, count),
    });
  }

  const easingRoles = ["ease-default"];
  const easings = pickRepresentativeValues(census.easings ?? {}, easingRoles.length);
  for (let i = 0; i < easings.length; i++) {
    const { value, count, samples } = easings[i];
    const roleName = easingRoles[i];
    out.push({
      name: roleName,
      value,
      type: "motion" as TokenType,
      category: "primitive" as const,
      cssVariable: `--${roleName}`,
      originalName: `${value.slice(0, 30)} (computed census)`,
      description: describeSamples(samples, count),
    });
  }

  return out;
}

type SurfaceColourCensus = Record<
  string,
  { count: number; elements: Array<{ tag: string; text: string; area: number; color: string }> }
>;

type ButtonColourCensus = Record<
  string,
  { count: number; elements: Array<{ tag: string; text: string; area: number; color: string }> }
>;

/** Parse a CSS rgb/rgba/#hex string into an {r,g,b} triple or null. */
function parseColour(value: string): { r: number; g: number; b: number } | null {
  const rgb = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) return { r: parseInt(rgb[1]), g: parseInt(rgb[2]), b: parseInt(rgb[3]) };
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3
      ? hex[1].split("").map((c) => c + c).join("")
      : hex[1];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  return null;
}

/** Distance in RGB space. Crude but sufficient to separate hues. */
function colourDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number }
): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function isNearWhite(c: { r: number; g: number; b: number }): boolean {
  return c.r > 235 && c.g > 235 && c.b > 235;
}
function isNearBlack(c: { r: number; g: number; b: number }): boolean {
  return c.r < 20 && c.g < 20 && c.b < 20;
}
function isGrey(c: { r: number; g: number; b: number }): boolean {
  return Math.abs(c.r - c.g) + Math.abs(c.g - c.b) + Math.abs(c.r - c.b) < 30;
}

/**
 * Mine the dominant CTA background colour(s) from the button colour census.
 * The top scorer becomes `--brand-primary-cta` (marked `groupName: "Brand"`
 * so the Colours panel surfaces it even when the CSS vars use semantic text
 * names like `--color-content-primary`). A distinct secondary hue becomes
 * `--brand-secondary-cta` if one exists.
 */
export function buildColourTokensFromCensus(census: ButtonColourCensus | undefined): ExtractedToken[] {
  if (!census) return [];

  type Scored = {
    value: string;
    rgb: { r: number; g: number; b: number };
    count: number;
    totalArea: number;
    score: number;
    sample: string;
  };

  const scored: Scored[] = [];
  for (const [value, info] of Object.entries(census)) {
    const rgb = parseColour(value);
    if (!rgb) continue;
    if (isNearWhite(rgb) || isNearBlack(rgb) || isGrey(rgb)) continue;
    const totalArea = info.elements.reduce((sum, e) => sum + (e.area || 0), 0);
    const score = info.count * Math.max(totalArea, 100);
    const sampleText = info.elements.find((e) => e.text)?.text ?? info.elements[0]?.tag ?? "";
    scored.push({ value, rgb, count: info.count, totalArea, score, sample: sampleText });
  }
  if (scored.length === 0) return [];

  scored.sort((a, b) => b.score - a.score);

  const primary = scored[0];
  const secondary = scored.find((c) => colourDistance(c.rgb, primary.rgb) > 60);

  const describe = (s: Scored, role: string): string => {
    const preview = s.sample ? ` — e.g. "${s.sample.slice(0, 30)}"` : "";
    return `${role} CTA background, dominant on ${s.count} button${s.count === 1 ? "" : "s"}${preview} /* mined from computed styles */`;
  };

  const out: ExtractedToken[] = [
    {
      name: "brand-primary-cta",
      value: primary.value,
      type: "color" as TokenType,
      category: "semantic" as const,
      cssVariable: "--brand-primary-cta",
      groupName: "Brand",
      originalName: `${primary.value} (button census)`,
      description: describe(primary, "Primary"),
    },
  ];

  if (secondary) {
    out.push({
      name: "brand-secondary-cta",
      value: secondary.value,
      type: "color" as TokenType,
      category: "semantic" as const,
      cssVariable: "--brand-secondary-cta",
      groupName: "Brand",
      originalName: `${secondary.value} (button census)`,
      description: describe(secondary, "Secondary"),
    });
  }

  return out;
}

/**
 * Mine surface / panel / tile background colours from the bounded DOM walk
 * census. Returns up to `maxTokens` distinct-hue saturated surfaces sorted
 * by area-weighted occurrence. Greys, near-whites, and near-blacks are
 * filtered upstream by the page script — this builder only handles
 * deduplication-by-hue and the final token shape.
 *
 * Hue distance threshold of 25° keeps near-duplicate tints (e.g. two
 * slightly different yellows) collapsed into one token rather than
 * emitting both — but allows yellow + pink + purple + orange to all
 * coexist when a site uses a multi-colour brand palette like Headspace.
 *
 * Each surface lands as `--brand-surface-N` with `groupName: "Brand"` so
 * the curated view surfaces them under Brand alongside the CTA tokens.
 */
export function buildSurfaceColoursFromCensus(
  census: SurfaceColourCensus | undefined,
  maxTokens = 6
): ExtractedToken[] {
  if (!census) return [];

  type Scored = {
    value: string;
    rgb: { r: number; g: number; b: number };
    hue: number;
    chroma: number;
    count: number;
    totalArea: number;
    score: number;
    sample: string;
  };

  const scored: Scored[] = [];
  for (const [value, info] of Object.entries(census)) {
    const rgb = parseColour(value);
    if (!rgb) continue;
    if (isNearWhite(rgb) || isNearBlack(rgb) || isGrey(rgb)) continue;
    const totalArea = info.elements.reduce((sum, e) => sum + (e.area || 0), 0);
    if (totalArea < 1000) continue; // require some real estate before promoting
    const score = info.count * Math.max(totalArea, 1000);
    const sampleText = info.elements.find((e) => e.text)?.text ?? info.elements[0]?.tag ?? "";
    const hue = hueOfRgb(rgb);
    const chroma = (Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b)) / 255;
    scored.push({ value, rgb, hue, chroma, count: info.count, totalArea, score, sample: sampleText });
  }
  if (scored.length === 0) return [];

  scored.sort((a, b) => b.score - a.score);

  // Distinct-hue dedupe: drop any candidate within 25° of an already-picked hue.
  // Keep the higher-scoring one (which is already first because we sorted by score).
  const picked: Scored[] = [];
  for (const cand of scored) {
    if (picked.length >= maxTokens) break;
    const tooClose = picked.some((p) => hueDistance(p.hue, cand.hue) < 25);
    if (tooClose) continue;
    picked.push(cand);
  }

  return picked.map((s, i) => {
    const preview = s.sample ? ` — e.g. "${s.sample.slice(0, 30)}"` : "";
    return {
      name: `brand-surface-${i + 1}`,
      value: s.value,
      type: "color" as TokenType,
      category: "semantic" as const,
      cssVariable: `--brand-surface-${i + 1}`,
      groupName: "Brand",
      originalName: `${s.value} (surface census)`,
      description: `Brand surface, dominant on ${s.count} element${s.count === 1 ? "" : "s"}${preview} /* mined from computed styles */`,
    };
  });
}

/** Hue (0-360°) of an RGB triple. Returns 0 for greyscale (caller should filter first). */
function hueOfRgb({ r, g, b }: { r: number; g: number; b: number }): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const range = max - min;
  if (range === 0) return 0;
  let h: number;
  if (max === r) h = ((g - b) / range) % 6;
  else if (max === g) h = (b - r) / range + 2;
  else h = (r - g) / range + 4;
  h *= 60;
  if (h < 0) h += 360;
  return h;
}

/** Shortest angular distance between two hues, 0-180°. */
function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, 360 - d);
}

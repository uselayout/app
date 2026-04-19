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

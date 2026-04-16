/**
 * Standardisation Engine
 *
 * Takes raw extracted tokens and classifies them against Layout's canonical
 * standard schema. Produces a StandardisedTokenMap with role assignments,
 * confidence scores, unassigned overflow, and auto-generated anti-patterns.
 */

import type { ExtractedToken, ExtractedTokens } from "@/lib/types";
import {
  STANDARD_SCHEMA,
  type StandardRole,
  type StandardisedTokenMap,
  type TokenAssignment,
  type UnassignedToken,
  type AntiPattern,
  buildStandardName,
  deriveKitPrefix,
} from "./standard-schema";

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Standardise extracted tokens against the Layout canonical schema.
 * Returns a token map with role assignments and unassigned overflow.
 */
export function standardiseTokens(
  tokens: ExtractedTokens,
  source: string,
  kitPrefix?: string
): StandardisedTokenMap {
  const prefix = kitPrefix ?? deriveKitPrefix(source);

  // Flatten all tokens into a single list with their type preserved
  const allTokens = flattenTokens(tokens);

  // Run matching in two passes
  const assignments = new Map<string, TokenAssignment>();
  const assignedTokenNames = new Set<string>();

  // Pass 1: Name-based matching (high confidence)
  for (const role of STANDARD_SCHEMA.roles) {
    if (assignments.has(role.key)) continue;
    const match = findBestNameMatch(role, allTokens, assignedTokenNames);
    if (match) {
      assignments.set(role.key, buildAssignment(role, match.token, prefix, match.confidence));
      assignedTokenNames.add(tokenKey(match.token));
    }
  }

  // Pass 2: Value-based matching for colour roles (medium/low confidence)
  const colourRoles = STANDARD_SCHEMA.roles.filter(
    (r) => ["backgrounds", "text", "borders", "accent", "status"].includes(r.category)
  );
  for (const role of colourRoles) {
    if (assignments.has(role.key)) continue;
    const match = findValueMatch(role, allTokens, assignedTokenNames, assignments);
    if (match) {
      assignments.set(role.key, buildAssignment(role, match.token, prefix, match.confidence));
      assignedTokenNames.add(tokenKey(match.token));
    }
  }

  // Pass 3: Value-based fallback for unfilled colour roles
  const colourFallbacks: { roleKey: string; picker: (tokens: { token: FlatToken; lightness: number }[]) => FlatToken | null }[] = [
    { roleKey: "bg-app", picker: (ts) => ts.sort((a, b) => b.lightness - a.lightness)[0]?.token ?? null },
    { roleKey: "bg-surface", picker: (ts) => { const sorted = ts.sort((a, b) => b.lightness - a.lightness); return sorted[1]?.token ?? null; } },
    { roleKey: "text-primary", picker: (ts) => ts.sort((a, b) => a.lightness - b.lightness)[0]?.token ?? null },
    { roleKey: "text-secondary", picker: (ts) => { const sorted = ts.sort((a, b) => a.lightness - b.lightness); return sorted.find((t) => t.lightness > 0.15 && t.lightness < 0.5)?.token ?? null; } },
    { roleKey: "accent", picker: (ts) => {
      const chromaTokens = ts
        .map((t) => ({ ...t, chroma: parseChroma(t.token.value) ?? estimateChromaFromHex(t.token.value) }))
        .filter((t) => t.chroma > 0.1 && t.lightness > 0.2 && t.lightness < 0.9)
        .sort((a, b) => b.chroma - a.chroma);
      return chromaTokens[0]?.token ?? null;
    }},
    { roleKey: "success", picker: (ts) => {
      const greens = ts.filter((t) => { const rgb = parseHexToRgb(t.token.value); return rgb && rgb.g > rgb.r * 1.3 && rgb.g > rgb.b * 1.3; });
      return greens[0]?.token ?? null;
    }},
    { roleKey: "warning", picker: (ts) => {
      const oranges = ts.filter((t) => { const rgb = parseHexToRgb(t.token.value); return rgb && rgb.r > 180 && rgb.g > 100 && rgb.g < 200 && rgb.b < 100; });
      return oranges[0]?.token ?? null;
    }},
    { roleKey: "error", picker: (ts) => {
      const reds = ts.filter((t) => { const rgb = parseHexToRgb(t.token.value); return rgb && rgb.r > rgb.g * 1.5 && rgb.r > rgb.b * 1.5; });
      return reds[0]?.token ?? null;
    }},
  ];

  for (const fallback of colourFallbacks) {
    if (assignments.has(fallback.roleKey)) continue;
    const role = STANDARD_SCHEMA.roles.find((r) => r.key === fallback.roleKey);
    if (!role) continue;

    const unassignedColours = allTokens
      .filter((t) => !assignedTokenNames.has(tokenKey(t)) && (t.sourceType === "color" || t.type === "color"))
      .map((t) => ({ token: t, lightness: parseLightness(t.value) }))
      .filter((x) => x.lightness !== null) as { token: FlatToken; lightness: number }[];

    const picked = fallback.picker(unassignedColours);
    if (picked) {
      assignments.set(fallback.roleKey, buildAssignment(role, picked, prefix, "low"));
      assignedTokenNames.add(tokenKey(picked));
    }
  }

  // Build unassigned list
  const unassigned: UnassignedToken[] = allTokens
    .filter((t) => !assignedTokenNames.has(tokenKey(t)))
    .map((t) => ({
      name: t.name,
      cssVariable: t.cssVariable,
      value: t.value,
      type: t.type,
      hidden: false,
    }));

  // Generate anti-patterns from extraction noise
  const antiPatterns = generateAntiPatterns(tokens, assignments);

  return { kitPrefix: prefix, assignments, unassigned, antiPatterns };
}

// ---------------------------------------------------------------------------
// Token flattening
// ---------------------------------------------------------------------------

interface FlatToken extends ExtractedToken {
  /** Which token array this came from */
  sourceType: string;
}

function flattenTokens(tokens: ExtractedTokens): FlatToken[] {
  const result: FlatToken[] = [];
  const types: [string, ExtractedToken[]][] = [
    ["color", tokens.colors],
    ["typography", tokens.typography],
    ["spacing", tokens.spacing],
    ["radius", tokens.radius],
    ["effect", tokens.effects],
    ["motion", tokens.motion],
  ];
  for (const [sourceType, list] of types) {
    for (const token of list) {
      result.push({ ...token, sourceType });
    }
  }
  return result;
}

function tokenKey(token: ExtractedToken): string {
  return `${token.cssVariable ?? token.name}::${token.value}`;
}

// ---------------------------------------------------------------------------
// Name-based matching (Pass 1)
// ---------------------------------------------------------------------------

interface MatchResult {
  token: FlatToken;
  confidence: "high" | "medium" | "low";
}

function findBestNameMatch(
  role: StandardRole,
  tokens: FlatToken[],
  assigned: Set<string>
): MatchResult | null {
  const candidates: { token: FlatToken; score: number }[] = [];

  for (const token of tokens) {
    if (assigned.has(tokenKey(token))) continue;
    if (!isCompatibleType(role, token)) continue;

    const rawName = (token.cssVariable ?? token.name).toLowerCase();
    // Strip common prefixes for better matching (fides-overlay-background-color → background-color)
    const name = stripCommonPrefixes(rawName);
    const score = scoreNameMatch(role, name, rawName);
    if (score < 2) continue; // Minimum score threshold

    // Cross-validate with lightness hints for colour roles
    if (role.matchHints?.lightness && token.type === "color") {
      const lightness = parseLightness(token.value);
      if (lightness !== null) {
        if (role.matchHints.lightness === "lightest" && lightness < 0.6) continue;
        if (role.matchHints.lightness === "darkest" && lightness > 0.4) continue;
      }
    }

    candidates.push({ token, score });
  }

  if (candidates.length === 0) return null;

  // Sort by score descending, prefer semantic over primitive
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Prefer semantic tokens
    if (a.token.category === "semantic" && b.token.category !== "semantic") return -1;
    if (b.token.category === "semantic" && a.token.category !== "semantic") return 1;
    return 0;
  });

  const best = candidates[0];
  const confidence: "high" | "medium" | "low" = best.score >= 5 ? "high" : best.score >= 3 ? "medium" : "low";
  return { token: best.token, confidence };
}

/** Words too generic to score on their own */
const NOISE_WORDS = new Set(["bg", "on", "sm", "md", "lg", "xl", "color", "colour", "default", "base", "a", "the"]);

/** Token name prefixes that indicate framework/utility tokens, not design system tokens */
const FRAMEWORK_PREFIXES = ["grid-", "tw-", "transition-", "animation-", "container-width", "container-max", "webkit-", "moz-"];

/** Strip common vendor/framework prefixes from token names for matching. */
function stripCommonPrefixes(name: string): string {
  return name
    .replace(/^--/, "")
    .replace(/^(fides-overlay-|chakra-|mantine-|radix-|shadcn-|ant-|mui-|color-)/, "");
}

function scoreNameMatch(role: StandardRole, strippedName: string, rawName: string): number {
  let score = 0;

  // Penalise framework/utility tokens
  if (FRAMEWORK_PREFIXES.some((p) => strippedName.startsWith(p))) {
    score -= 3;
  }

  // Exact suffix match on raw name (highest signal)
  if (rawName.endsWith(role.suffix) || rawName.endsWith(`-${role.suffix}`)) {
    score += 5;
  }

  // Contains suffix (e.g. --border-primary contains "border")
  if (strippedName.includes(role.suffix) && role.suffix.length >= 4) {
    score += 3;
  }

  // Full keyword matches (on both stripped and raw names)
  for (const keyword of role.matchKeywords) {
    if (keyword.length >= 3 && (strippedName.includes(keyword) || rawName.includes(keyword))) {
      score += 3;
      break;
    }
  }

  // Partial word overlap (only meaningful words)
  const nameWords = strippedName.split(/[-_]/).filter((w) => w.length >= 3 && !NOISE_WORDS.has(w));
  const keywordWords = role.matchKeywords
    .flatMap((k) => k.split("-"))
    .filter((w) => w.length >= 3 && !NOISE_WORDS.has(w));
  const overlap = nameWords.filter((w) => keywordWords.includes(w)).length;
  if (overlap > 0) {
    score += Math.min(overlap, 2);
  }

  return score;
}

function isCompatibleType(role: StandardRole, token: FlatToken): boolean {
  const colourCategories = ["backgrounds", "text", "borders", "accent", "status"];
  if (colourCategories.includes(role.category)) {
    return token.sourceType === "color" || token.type === "color";
  }
  if (role.category === "typography") {
    return token.sourceType === "typography" || token.type === "typography";
  }
  if (role.category === "spacing") {
    return token.sourceType === "spacing" || token.type === "spacing";
  }
  if (role.category === "radius") {
    return token.sourceType === "radius" || token.type === "radius";
  }
  if (role.category === "shadows") {
    return token.sourceType === "effect" || token.type === "effect";
  }
  if (role.category === "motion") {
    return token.sourceType === "motion" || token.type === "motion";
  }
  return true;
}

// ---------------------------------------------------------------------------
// Value-based matching (Pass 2) — colours only
// ---------------------------------------------------------------------------

function findValueMatch(
  role: StandardRole,
  tokens: FlatToken[],
  assigned: Set<string>,
  existingAssignments: Map<string, TokenAssignment>
): MatchResult | null {
  if (!role.matchHints) return null;

  const colourTokens = tokens.filter(
    (t) => !assigned.has(tokenKey(t)) && (t.sourceType === "color" || t.type === "color")
  );

  if (colourTokens.length === 0) return null;

  // Parse lightness for all candidates
  const withLightness = colourTokens
    .map((t) => ({ token: t, lightness: parseLightness(t.value) }))
    .filter((x) => x.lightness !== null) as { token: FlatToken; lightness: number }[];

  if (withLightness.length === 0) return null;

  const { lightness } = role.matchHints;

  if (lightness === "lightest") {
    withLightness.sort((a, b) => b.lightness - a.lightness);
    return { token: withLightness[0].token, confidence: "low" };
  }

  if (lightness === "darkest") {
    withLightness.sort((a, b) => a.lightness - b.lightness);
    return { token: withLightness[0].token, confidence: "low" };
  }

  if (lightness === "accent") {
    // Most saturated colour that isn't near-black or near-white
    const filtered = withLightness.filter((x) => x.lightness > 0.15 && x.lightness < 0.85);
    if (filtered.length === 0) return null;

    // First: prefer tokens whose name contains "primary", "accent", or "brand"
    const accentKeywords = ["primary", "accent", "brand", "action", "cta"];
    const namedAccent = filtered.find((x) => {
      const name = (x.token.cssVariable ?? x.token.name).toLowerCase();
      return accentKeywords.some((kw) => name.includes(kw));
    });
    if (namedAccent) {
      return { token: namedAccent.token, confidence: "medium" };
    }

    // Fallback: most saturated (lower chroma threshold)
    const withChroma = filtered
      .map((x) => ({ ...x, chroma: parseChroma(x.token.value) ?? estimateChromaFromHex(x.token.value) }))
      .sort((a, b) => b.chroma - a.chroma);
    if (withChroma.length > 0 && withChroma[0].chroma > 0.001) {
      return { token: withChroma[0].token, confidence: "low" };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Colour parsing helpers
// ---------------------------------------------------------------------------

/**
 * Extract perceptual lightness (0-1) from a CSS colour value.
 * Supports oklch(), hex, rgb/rgba.
 */
function parseLightness(value: string): number | null {
  const v = value.trim().toLowerCase();

  // oklch(L C H) — L is already 0-1
  const oklchMatch = v.match(/oklch\(\s*([\d.]+)/);
  if (oklchMatch) return parseFloat(oklchMatch[1]);

  // hex → lightness approximation
  const hex = parseHexToRgb(v);
  if (hex) return rgbToLightness(hex.r, hex.g, hex.b);

  // rgb/rgba
  const rgbMatch = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return rgbToLightness(
      parseInt(rgbMatch[1], 10),
      parseInt(rgbMatch[2], 10),
      parseInt(rgbMatch[3], 10)
    );
  }

  return null;
}

/** Extract chroma from oklch() values. Returns null for non-oklch. */
function parseChroma(value: string): number | null {
  const match = value.trim().toLowerCase().match(/oklch\(\s*[\d.]+\s+([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

/** Rough chroma estimate for hex/rgb colours (max channel difference / 255). */
function estimateChromaFromHex(value: string): number {
  const rgb = parseHexToRgb(value);
  if (!rgb) return 0;
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  return (max - min) / 255;
}

function parseHexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex;
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length === 8) h = h.slice(0, 6); // drop alpha
  if (h.length === 4) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; // 4-digit with alpha
  if (h.length !== 6 || !/^[0-9a-f]{6}$/i.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Simple relative luminance approximation (0-1). */
function rgbToLightness(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// ---------------------------------------------------------------------------
// Assignment builder
// ---------------------------------------------------------------------------

function buildAssignment(
  role: StandardRole,
  token: FlatToken,
  kitPrefix: string,
  confidence: "high" | "medium" | "low"
): TokenAssignment {
  return {
    roleKey: role.key,
    originalName: token.name,
    originalCssVariable: token.cssVariable,
    value: token.value,
    standardName: buildStandardName(kitPrefix, role.suffix),
    confidence,
    userConfirmed: false,
  };
}

// ---------------------------------------------------------------------------
// Anti-pattern generation
// ---------------------------------------------------------------------------

function generateAntiPatterns(
  tokens: ExtractedTokens,
  assignments: Map<string, TokenAssignment>
): AntiPattern[] {
  const patterns: AntiPattern[] = [];

  // 1. Spacing noise: find off-grid values
  const spacingValues = tokens.spacing
    .map((t) => parsePixelValue(t.value))
    .filter((v): v is number => v !== null);

  if (spacingValues.length > 0) {
    const offGrid = spacingValues.filter((v) => v % 4 !== 0);
    if (offGrid.length > 0) {
      const unique = [...new Set(offGrid)].sort((a, b) => a - b);
      patterns.push({
        rule: `NEVER use spacing values not on the 4px grid.`,
        reason: `${unique.length} off-grid spacing value${unique.length > 1 ? "s" : ""} found in extraction (${unique.map((v) => `${v}px`).join(", ")}). These break visual rhythm and create inconsistent layouts.`,
        fix: `Round to the nearest multiple of 4 and use the corresponding --space-* token.`,
      });
    }

    // Too many unique spacing values
    const uniqueSpacing = [...new Set(spacingValues)];
    if (uniqueSpacing.length > 10) {
      patterns.push({
        rule: `Standardise spacing to 7 scale tokens (xs through 3xl).`,
        reason: `${uniqueSpacing.length} unique spacing values extracted. More than 10 distinct values indicates an inconsistent spacing system that will confuse AI agents.`,
        fix: `Use only the standardised spacing scale. Map extracted values to the nearest token.`,
      });
    }
  }

  // 2. Radius noise: too many distinct values
  const radiusValues = tokens.radius
    .map((t) => parsePixelValue(t.value))
    .filter((v): v is number => v !== null);
  const uniqueRadius = [...new Set(radiusValues)];
  if (uniqueRadius.length > 5) {
    patterns.push({
      rule: `Standardise border-radius to 4 tokens (sm, md, lg, full).`,
      reason: `${uniqueRadius.length} distinct radius values found. Pick 3-4 canonical values and use those exclusively.`,
      fix: `Use --radius-sm, --radius-md, --radius-lg, --radius-full. Map all extracted values to the nearest standard token.`,
    });
  }

  // 3. Near-duplicate colours
  const colourLightnesses = tokens.colors
    .map((t) => ({ name: t.name, lightness: parseLightness(t.value), value: t.value }))
    .filter((x) => x.lightness !== null);

  const nearDuplicates: string[] = [];
  for (let i = 0; i < colourLightnesses.length; i++) {
    for (let j = i + 1; j < colourLightnesses.length; j++) {
      const diff = Math.abs(colourLightnesses[i].lightness! - colourLightnesses[j].lightness!);
      if (diff < 0.02 && colourLightnesses[i].value !== colourLightnesses[j].value) {
        nearDuplicates.push(`${colourLightnesses[i].name} ≈ ${colourLightnesses[j].name}`);
      }
    }
  }
  if (nearDuplicates.length > 3) {
    patterns.push({
      rule: `Consolidate near-duplicate colours.`,
      reason: `${nearDuplicates.length} pairs of nearly identical colours found. This creates token bloat without visual distinction.`,
      fix: `Pick one canonical value per visual role. Merge near-duplicates into a single token.`,
    });
  }

  // 4. Colour count warning
  if (tokens.colors.length > 50) {
    const assignedCount = [...assignments.values()].filter(
      (a) => ["backgrounds", "text", "borders", "accent", "status"].some(
        (cat) => STANDARD_SCHEMA.roles.find((r) => r.key === a.roleKey)?.category === cat
      )
    ).length;
    patterns.push({
      rule: `${tokens.colors.length} colour tokens extracted. Only ${assignedCount} mapped to standard roles.`,
      reason: `AI agents produce better code from 25-30 curated colour tokens than 100+ raw tokens. Excess tokens dilute guidance and increase chance of off-brand output.`,
      fix: `Review the curated token map. Hide tokens that are duplicates, component-specific overrides, or framework utilities.`,
    });
  }

  return patterns;
}

function parsePixelValue(value: string): number | null {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*px$/);
  return match ? parseFloat(match[1]) : null;
}

// ---------------------------------------------------------------------------
// Apply standardisation to extraction tokens (mutates in place)
// ---------------------------------------------------------------------------

/**
 * Apply a StandardisedTokenMap back to the extraction tokens,
 * setting standardRole, standardName, and standardConfidence fields.
 */
export function applyStandardisation(
  tokens: ExtractedTokens,
  tokenMap: StandardisedTokenMap
): void {
  const allTokenArrays = [
    tokens.colors,
    tokens.typography,
    tokens.spacing,
    tokens.radius,
    tokens.effects,
    tokens.motion,
  ];

  // Build a lookup from original name → assignment
  const assignmentByOriginal = new Map<string, TokenAssignment>();
  for (const assignment of tokenMap.assignments.values()) {
    const key = `${assignment.originalCssVariable ?? assignment.originalName}::${assignment.value}`;
    assignmentByOriginal.set(key, assignment);
  }

  // Build a lookup for hidden tokens
  const hiddenKeys = new Set(
    tokenMap.unassigned.filter((u) => u.hidden).map((u) => `${u.cssVariable ?? u.name}::${u.value}`)
  );

  for (const tokenArray of allTokenArrays) {
    for (const token of tokenArray) {
      const key = `${token.cssVariable ?? token.name}::${token.value}`;
      const assignment = assignmentByOriginal.get(key);
      if (assignment) {
        token.standardRole = assignment.roleKey;
        token.standardName = assignment.standardName;
        token.standardConfidence = assignment.confidence;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Get curated tokens for synthesis
// ---------------------------------------------------------------------------

/**
 * Extract only the curated (role-assigned) tokens from extraction data,
 * organised by schema category. Used to feed a tighter token set to Claude.
 */
export function getCuratedTokens(
  tokens: ExtractedTokens
): Record<string, ExtractedToken[]> {
  const allTokens = [
    ...tokens.colors,
    ...tokens.typography,
    ...tokens.spacing,
    ...tokens.radius,
    ...tokens.effects,
    ...tokens.motion,
  ];

  const curated = allTokens.filter((t) => t.standardRole);

  const grouped: Record<string, ExtractedToken[]> = {};
  for (const token of curated) {
    const role = STANDARD_SCHEMA.roles.find((r) => r.key === token.standardRole);
    const category = role?.category ?? "other";
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(token);
  }

  return grouped;
}

/**
 * Get statistics about standardisation coverage.
 */
export function getStandardisationStats(tokenMap: StandardisedTokenMap): {
  totalRoles: number;
  assignedRoles: number;
  requiredRoles: number;
  assignedRequired: number;
  unassignedCount: number;
  hiddenCount: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  completeness: number;
} {
  const requiredRoles = STANDARD_SCHEMA.roles.filter((r) => r.required);
  const assignedRequired = requiredRoles.filter((r) => tokenMap.assignments.has(r.key)).length;
  const assignments = [...tokenMap.assignments.values()];

  return {
    totalRoles: STANDARD_SCHEMA.roles.length,
    assignedRoles: tokenMap.assignments.size,
    requiredRoles: requiredRoles.length,
    assignedRequired,
    unassignedCount: tokenMap.unassigned.length,
    hiddenCount: tokenMap.unassigned.filter((u) => u.hidden).length,
    highConfidence: assignments.filter((a) => a.confidence === "high").length,
    mediumConfidence: assignments.filter((a) => a.confidence === "medium").length,
    lowConfidence: assignments.filter((a) => a.confidence === "low").length,
    completeness: requiredRoles.length > 0
      ? Math.round((assignedRequired / requiredRoles.length) * 100)
      : 0,
  };
}

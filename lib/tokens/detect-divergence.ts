import type { ExtractedToken, ExtractedTokens, ExtractionResult } from "@/lib/types";
import { parseTokensFromLayoutMd } from "./parse-layout-md";

export interface TokenDivergenceReport {
  /** Tokens present on both sides but with different values. */
  valueDivergences: ValueDivergence[];
}

export interface ValueDivergence {
  name: string;
  type: ExtractedToken["type"];
  mdValue: string;
  dataValue: string;
  mode?: string;
}

/**
 * Normalise a token name for cross-source comparison. The layout.md parser
 * emits names with the `--` prefix (e.g. `--font-size-md`) because CSS
 * declarations include it. Census-based miners in scale-builder.ts emit
 * bare role names (`font-size-md`). Without stripping the prefix the same
 * token appears on both sides of the divergence banner.
 */
function normaliseName(name: string): string {
  return name.replace(/^--/, "");
}

function keyFor(t: { name: string; mode?: string }): string {
  const n = normaliseName(t.name);
  return t.mode ? `${n}::${t.mode}` : n;
}

/**
 * Normalise a CSS token value for semantic comparison. Two values that differ
 * only in whitespace, hex case, or short- vs long-form hex are the same token
 * value — so `rgba(0,0,0,0.06)` and `rgba(0, 0, 0, 0.06)` should not flag as
 * divergent. Keeps comparison strict on anything that could actually change
 * rendering.
 */
function normaliseValueForCompare(value: string): string {
  let v = value.trim().toLowerCase();
  v = v.replace(/#([0-9a-f])([0-9a-f])([0-9a-f])\b/g, (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`);
  v = v.replace(/#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])\b/g, (_, r, g, b, a) => `#${r}${r}${g}${g}${b}${b}${a}${a}`);
  v = v.replace(/\s*,\s*/g, ",");
  v = v.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
  v = v.replace(/\s+/g, " ");
  return v;
}

function flattenTokens(tokens: ExtractedTokens | undefined): ExtractedToken[] {
  if (!tokens) return [];
  return [
    ...tokens.colors,
    ...tokens.typography,
    ...tokens.spacing,
    ...tokens.radius,
    ...tokens.effects,
    ...tokens.motion,
  ];
}

/**
 * Detect value conflicts between layout.md and the structured extraction.
 *
 * A value conflict is when the same token name appears on both sides but
 * with semantically different values (whitespace, hex case, and short-form
 * hex differences are normalised away).
 *
 * Deliberately does NOT surface "token present in one source, missing from
 * the other" — that bucket was 95% noise (extraction captures a superset of
 * what the curated layout.md documents, and that's correct). That signal is
 * now handled by per-token indicators in the Source Panel.
 */
export function detectTokenDivergence(
  layoutMd: string,
  extraction: ExtractionResult | undefined | null
): TokenDivergenceReport {
  const mdTokens = parseTokensFromLayoutMd(layoutMd);
  const mdList = flattenTokens(mdTokens);
  const dataList = flattenTokens(extraction?.tokens);

  const dataMap = new Map<string, ExtractedToken>();
  for (const t of dataList) dataMap.set(keyFor(t), t);

  const valueDivergences: ValueDivergence[] = [];
  for (const mdToken of mdList) {
    const dataToken = dataMap.get(keyFor(mdToken));
    if (!dataToken) continue;
    if (normaliseValueForCompare(mdToken.value) !== normaliseValueForCompare(dataToken.value)) {
      valueDivergences.push({
        name: mdToken.name,
        type: mdToken.type,
        mdValue: mdToken.value,
        dataValue: dataToken.value,
        mode: mdToken.mode,
      });
    }
  }

  return { valueDivergences };
}

export function divergenceIsEmpty(r: TokenDivergenceReport): boolean {
  return r.valueDivergences.length === 0;
}

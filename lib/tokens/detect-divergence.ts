import type { ExtractedToken, ExtractedTokens, ExtractionResult } from "@/lib/types";
import { parseTokensFromLayoutMd } from "./parse-layout-md";

export interface TokenDivergenceReport {
  /** Tokens declared in layout.md that have no counterpart in extractionData. */
  tokensInMdNotInData: DivergentToken[];
  /** Tokens in extractionData that aren't declared anywhere in layout.md. */
  tokensInDataNotInMd: DivergentToken[];
  /** Tokens in both, but with different values. */
  valueDivergences: ValueDivergence[];
}

export interface DivergentToken {
  name: string;
  value: string;
  type: ExtractedToken["type"];
  mode?: string;
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
  // Expand 3-digit hex to 6-digit so #fff == #ffffff.
  v = v.replace(/#([0-9a-f])([0-9a-f])([0-9a-f])\b/g, (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`);
  // Expand 4-digit hex to 8-digit so #fff8 == #ffffff88.
  v = v.replace(/#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])\b/g, (_, r, g, b, a) => `#${r}${r}${g}${g}${b}${b}${a}${a}`);
  // Drop spaces after commas and inside parens so rgba(0, 0, 0, 0.06) == rgba(0,0,0,0.06).
  v = v.replace(/\s*,\s*/g, ",");
  v = v.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
  // Collapse any remaining runs of whitespace to single spaces.
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
 * Compare the CSS declarations visible inside layout.md against the structured
 * extractionData. Surfaces three kinds of drift that would otherwise be silent:
 *
 * 1. Tokens in layout.md that no longer exist in extraction (user kept a stale
 *    prose mention after a re-extract).
 * 2. Tokens in extraction that layout.md never references (forgot to document).
 * 3. Tokens in both but with different values (manual edit went out of sync).
 *
 * Only compares declarations (not `var(--x)` usages). Values are compared as
 * trimmed strings.
 */
export function detectTokenDivergence(
  layoutMd: string,
  extraction: ExtractionResult | undefined | null
): TokenDivergenceReport {
  const mdTokens = parseTokensFromLayoutMd(layoutMd);
  const mdList = flattenTokens(mdTokens);
  const dataList = flattenTokens(extraction?.tokens);

  const mdMap = new Map<string, ExtractedToken>();
  for (const t of mdList) mdMap.set(keyFor(t), t);

  const dataMap = new Map<string, ExtractedToken>();
  for (const t of dataList) dataMap.set(keyFor(t), t);

  const tokensInMdNotInData: DivergentToken[] = [];
  const valueDivergences: ValueDivergence[] = [];

  for (const [key, mdToken] of mdMap) {
    const dataToken = dataMap.get(key);
    if (!dataToken) {
      tokensInMdNotInData.push({
        name: mdToken.name,
        value: mdToken.value,
        type: mdToken.type,
        mode: mdToken.mode,
      });
      continue;
    }
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

  const tokensInDataNotInMd: DivergentToken[] = [];
  for (const [key, dataToken] of dataMap) {
    if (mdMap.has(key)) continue;
    tokensInDataNotInMd.push({
      name: dataToken.name,
      value: dataToken.value,
      type: dataToken.type,
      mode: dataToken.mode,
    });
  }

  return { tokensInMdNotInData, tokensInDataNotInMd, valueDivergences };
}

export function divergenceIsEmpty(r: TokenDivergenceReport): boolean {
  return (
    r.tokensInMdNotInData.length === 0 &&
    r.tokensInDataNotInMd.length === 0 &&
    r.valueDivergences.length === 0
  );
}

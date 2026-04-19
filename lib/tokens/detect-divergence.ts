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

function keyFor(t: { name: string; mode?: string }): string {
  return t.mode ? `${t.name}::${t.mode}` : t.name;
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
    if (mdToken.value.trim() !== dataToken.value.trim()) {
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

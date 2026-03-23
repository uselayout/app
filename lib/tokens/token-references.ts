import type { ExtractedToken, ExtractedTokens } from "@/lib/types";

/**
 * Find tokens whose value references the given token via var().
 * E.g. if tokenName is "--primitive-gold-500", returns tokens
 * with values like "var(--primitive-gold-500)".
 */
export function findTokenReferences(
  allTokens: ExtractedToken[],
  tokenName: string
): ExtractedToken[] {
  const pattern = `var(${tokenName})`;
  return allTokens.filter((t) => t.value.includes(pattern));
}

/**
 * Flatten all token arrays into a single list.
 */
export function flattenTokens(tokens: ExtractedTokens): ExtractedToken[] {
  return [
    ...tokens.colors,
    ...tokens.typography,
    ...tokens.spacing,
    ...tokens.radius,
    ...tokens.effects,
  ];
}

import type { ExtractedToken } from "@/lib/types";

/**
 * Insert a CSS custom property declaration into the CORE TOKENS block of layout.md.
 * If the CORE TOKENS block is not found, returns the markdown unchanged.
 * If the token's cssVariable already exists inside the block, returns the markdown unchanged
 * (let replaceTokenInLayoutMd handle value updates for existing tokens).
 */
export function addTokenToLayoutMd(
  markdown: string,
  token: ExtractedToken
): string {
  const cssVar = token.cssVariable ?? `--${token.name}`;
  const declaration = `  ${cssVar}: ${token.value};`;

  const coreTokensRegex = /(```css\s*\n\/\*\s*──?\s*CORE TOKENS[\s\S]*?)(\n```)/;
  const match = markdown.match(coreTokensRegex);
  if (!match) return markdown;

  // Don't duplicate
  const escaped = cssVar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existsRegex = new RegExp(`^\\s*${escaped}\\s*:`, "m");
  if (existsRegex.test(match[1])) return markdown;

  const inserted = match[1] + "\n" + declaration + match[2];
  return markdown.replace(coreTokensRegex, inserted);
}

/**
 * Remove a CSS custom property declaration from the CORE TOKENS block of layout.md.
 * Matches the line starting with the token's cssVariable (or --name fallback).
 * Returns the markdown unchanged if the declaration is not found.
 */
export function removeTokenFromLayoutMd(
  markdown: string,
  token: { name: string; cssVariable?: string }
): string {
  const cssVar = token.cssVariable ?? `--${token.name}`;
  const escaped = cssVar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const coreTokensRegex = /```css\s*\n\/\*\s*──?\s*CORE TOKENS[\s\S]*?```/;
  const match = markdown.match(coreTokensRegex);
  if (!match) return markdown;

  const block = match[0];
  const lineRegex = new RegExp(`\\n\\s*${escaped}\\s*:[^\\n]*`, "g");
  const updatedBlock = block.replace(lineRegex, "");
  if (updatedBlock === block) return markdown;

  return markdown.replace(coreTokensRegex, updatedBlock);
}

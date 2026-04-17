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
 * Remove a CSS custom property declaration from ALL fenced CSS blocks in layout.md.
 * This is thorough on purpose: `parseTokensFromLayoutMd` reads every fenced CSS block,
 * so leaving a declaration in any one of them would resurrect the deleted token when
 * the Design System page re-syncs from markdown.
 * Only removes declaration lines (`--name: value;`). `var(--name)` usage is left alone.
 * Returns the markdown unchanged if no declaration is found.
 */
export function removeTokenFromLayoutMd(
  markdown: string,
  token: { name: string; cssVariable?: string }
): string {
  const cssVar = token.cssVariable ?? `--${token.name}`;
  const escaped = cssVar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const fencedBlockRegex = /```css\s*\n([\s\S]*?)```/gi;
  const lineRegex = new RegExp(`[ \\t]*${escaped}\\s*:[^\\n;]*;?[ \\t]*\\n?`, "g");

  return markdown.replace(fencedBlockRegex, (fullMatch, content: string) => {
    const cleaned = content.replace(lineRegex, "");
    if (cleaned === content) return fullMatch;
    return fullMatch.replace(content, cleaned);
  });
}

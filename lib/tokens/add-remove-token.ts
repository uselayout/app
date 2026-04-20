import type { ExtractedToken, TokenType } from "@/lib/types";

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

const SECTION_HEADING_PATTERNS: Record<TokenType, RegExp> = {
  color: /^##\s+\d+\.\s*Colou?r/im,
  typography: /^##\s+\d+\.\s*Typography/im,
  spacing: /^##\s+\d+\.\s*Spacing/im,
  radius: /^##\s+\d+\.\s*Spacing/im,
  effect: /^##\s+\d+\.\s*(?:Elevation|Effect|Depth|Shadow)/im,
  motion: /^##\s+\d+\.\s*Motion/im,
};

function findSectionCssBlock(
  markdown: string,
  headingRegex: RegExp
): { start: number; end: number; inner: string } | null {
  const heading = markdown.match(headingRegex);
  if (!heading || heading.index === undefined) return null;
  const after = heading.index + heading[0].length;
  const rest = markdown.slice(after);
  const block = rest.match(/```css\s*\n([\s\S]*?)```/);
  if (!block || block.index === undefined) return null;
  const start = after + block.index;
  const end = start + block[0].length;
  return { start, end, inner: block[1] };
}

/**
 * Append tokens to layout.md, each placed in the CSS block of its type's
 * section (colour \u2192 \u00a72, typography \u2192 \u00a73, spacing/radius \u2192 \u00a74, effect \u2192 \u00a77,
 * motion \u2192 \u00a78). Tokens whose section is absent fall back to CORE TOKENS
 * via addTokenToLayoutMd. Duplicates in the target block are skipped.
 */
export function appendTokensToSections(
  markdown: string,
  tokens: ExtractedToken[]
): string {
  if (tokens.length === 0) return markdown;

  const byType = new Map<TokenType, ExtractedToken[]>();
  for (const t of tokens) {
    const existing = byType.get(t.type) ?? [];
    existing.push(t);
    byType.set(t.type, existing);
  }

  let result = markdown;
  const fallbackTokens: ExtractedToken[] = [];

  for (const [type, typeTokens] of byType) {
    const headingRegex = SECTION_HEADING_PATTERNS[type];
    if (!headingRegex) {
      fallbackTokens.push(...typeTokens);
      continue;
    }

    const block = findSectionCssBlock(result, headingRegex);
    if (!block) {
      fallbackTokens.push(...typeTokens);
      continue;
    }

    const newDeclarations: string[] = [];
    for (const token of typeTokens) {
      const cssVar = token.cssVariable ?? `--${token.name}`;
      const escaped = cssVar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const existsRegex = new RegExp(`^\\s*${escaped}\\s*:`, "m");
      if (existsRegex.test(block.inner)) continue;
      if (newDeclarations.some((d) => d.trimStart().startsWith(`${cssVar}:`))) continue;
      newDeclarations.push(`${cssVar}: ${token.value};`);
    }

    if (newDeclarations.length === 0) continue;

    const trimmedInner = block.inner.replace(/\s+$/, "");
    const addedBlock =
      `${trimmedInner}\n\n/* \u2500\u2500 Added from extraction \u2500\u2500 */\n` +
      newDeclarations.join("\n") +
      "\n";
    const newBlockText = "```css\n" + addedBlock + "```";
    result = result.slice(0, block.start) + newBlockText + result.slice(block.end);
  }

  for (const token of fallbackTokens) {
    result = addTokenToLayoutMd(result, token);
  }

  return result;
}

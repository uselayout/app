import type { ExtractedToken, ExtractedTokens, TokenType } from "@/lib/types";

/**
 * Parse CSS custom property declarations from fenced CSS blocks in a layout.md file.
 * Returns structured tokens compatible with ExtractionResult.tokens.
 */
export function parseTokensFromLayoutMd(markdown: string): ExtractedTokens {
  const declarations = [
    ...extractCSSDeclarations(markdown),
    ...extractTableDeclarations(markdown),
  ];
  const seen = new Map<string, ExtractedToken>();

  for (const { name, value, mode } of declarations) {
    const token = classifyToken(name, value);
    if (!token) continue;
    if (mode) token.mode = mode;
    const key = mode ? `${name}::${mode}` : name;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, token);
      continue;
    }
    // Prefer declarations with concrete values (hex / rgb / px) over unresolved
    // `var(--something)` references. Otherwise a later semantic declaration like
    // `--color-primary: var(--orange-500)` would overwrite a Quick-Reference
    // declaration with the actual hex.
    const existingIsRef = existing.value.includes("var(");
    const newIsRef = token.value.includes("var(");
    if (existingIsRef && !newIsRef) {
      seen.set(key, token);
    } else if (existingIsRef === newIsRef) {
      // Same kind — later wins (matches prior behaviour for legitimate overrides).
      seen.set(key, token);
    }
    // existing is concrete and new is a ref → keep existing
  }

  const colors: ExtractedToken[] = [];
  const typography: ExtractedToken[] = [];
  const spacing: ExtractedToken[] = [];
  const radius: ExtractedToken[] = [];
  const effects: ExtractedToken[] = [];
  const motion: ExtractedToken[] = [];

  for (const token of seen.values()) {
    switch (token.type) {
      case "color": colors.push(token); break;
      case "typography": typography.push(token); break;
      case "spacing": spacing.push(token); break;
      case "radius": radius.push(token); break;
      case "effect": effects.push(token); break;
      case "motion": motion.push(token); break;
    }
  }

  return { colors, typography, spacing, radius, effects, motion };
}

interface CSSDeclaration {
  name: string;
  value: string;
  mode?: string;
}

/**
 * Extract all `--name: value;` declarations from fenced CSS blocks in markdown.
 * Detects dark-mode selectors ([data-theme="dark"], @media (prefers-color-scheme: dark))
 * and tags those declarations with mode: "dark".
 */
function extractCSSDeclarations(markdown: string): CSSDeclaration[] {
  const declarations: CSSDeclaration[] = [];
  const fencedBlockRegex = /```css\s*\n([\s\S]*?)```/gi;

  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = fencedBlockRegex.exec(markdown)) !== null) {
    extractDeclarationsFromBlock(blockMatch[1], declarations);
  }

  return declarations;
}

/**
 * Extract CSS declarations from a single fenced block, detecting dark-mode
 * selectors and tagging declarations with the appropriate mode.
 */
function extractDeclarationsFromBlock(blockContent: string, declarations: CSSDeclaration[]): void {
  const innerDeclRegex = /(--[\w-]+)\s*:\s*([^;]+);/g;

  // Detect dark-mode selector blocks and their ranges
  const darkSelectorPattern = /\[data-theme\s*=\s*["']dark["']\]\s*\{([^}]*)\}/gi;
  const darkMediaPattern = /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[^{]*\{([^}]*)\}\s*\}/gi;

  const darkRanges: Array<[number, number]> = [];

  // Extract dark-mode declarations from [data-theme="dark"] blocks
  let modeMatch: RegExpExecArray | null;
  while ((modeMatch = darkSelectorPattern.exec(blockContent)) !== null) {
    darkRanges.push([modeMatch.index, modeMatch.index + modeMatch[0].length]);
    let declMatch: RegExpExecArray | null;
    const re = new RegExp(innerDeclRegex.source, innerDeclRegex.flags);
    while ((declMatch = re.exec(modeMatch[1])) !== null) {
      declarations.push({ name: declMatch[1].trim(), value: declMatch[2].trim(), mode: "dark" });
    }
  }

  // Extract dark-mode declarations from @media (prefers-color-scheme: dark) blocks
  while ((modeMatch = darkMediaPattern.exec(blockContent)) !== null) {
    darkRanges.push([modeMatch.index, modeMatch.index + modeMatch[0].length]);
    let declMatch: RegExpExecArray | null;
    const re = new RegExp(innerDeclRegex.source, innerDeclRegex.flags);
    while ((declMatch = re.exec(modeMatch[1])) !== null) {
      declarations.push({ name: declMatch[1].trim(), value: declMatch[2].trim(), mode: "dark" });
    }
  }

  // Extract remaining (default/light) declarations, skipping those inside dark blocks
  const topLevelRegex = new RegExp(innerDeclRegex.source, innerDeclRegex.flags);
  let declMatch: RegExpExecArray | null;
  while ((declMatch = topLevelRegex.exec(blockContent)) !== null) {
    const pos = declMatch.index;
    const inDarkBlock = darkRanges.some(([start, end]) => pos >= start && pos < end);
    if (!inDarkBlock) {
      declarations.push({ name: declMatch[1].trim(), value: declMatch[2].trim() });
    }
  }
}

/**
 * Extract token declarations from markdown tables.
 * Many synthesised layout.md files list primitives (like `--orange-500` → `#ff5a00`)
 * in markdown tables rather than CSS blocks. Without this, references like
 * `--color-primary: var(--orange-500)` resolve to nothing and swatches render blank.
 */
function extractTableDeclarations(markdown: string): CSSDeclaration[] {
  const declarations: CSSDeclaration[] = [];
  const stripped = markdown.replace(/```[\s\S]*?```/g, "");

  const rowRegex = /^\s*\|\s*`?\s*(--[\w-]+)\s*`?\s*\|\s*`?\s*([^|`\n]+?)\s*`?\s*\|/gm;
  for (const match of stripped.matchAll(rowRegex)) {
    const name = match[1].trim();
    const value = match[2].trim();
    if (!value || value === "—" || value === "-" || value.startsWith("|")) continue;
    if (value.startsWith("var(")) continue;
    declarations.push({ name, value });
  }

  return declarations;
}

const COLOR_PATTERNS = [
  /^#[0-9a-f]{3,8}$/i,
  /^rgba?\(/i,
  /^hsla?\(/i,
  /^oklch\(/i,
  /^oklab\(/i,
  /^lab\(/i,
  /^lch\(/i,
  /^color\(/i,
];

function isColourValue(value: string): boolean {
  return COLOR_PATTERNS.some((re) => re.test(value));
}

/**
 * Classify a CSS custom property into a token type.
 * Uses name-based heuristics first (matching the website extractor),
 * then falls back to value-based detection for unclassified tokens.
 */
function classifyToken(name: string, value: string): ExtractedToken | null {
  const lower = name.toLowerCase();
  let type: TokenType | null = null;

  // Name-based classification (matches css-extract.ts pattern)
  if (lower.includes("color") || lower.includes("bg") || lower.includes("border") || lower.includes("fill") || lower.includes("stroke")) {
    type = "color";
  } else if (lower.includes("shadow") || lower.includes("blur") || lower.includes("opacity") || lower.includes("effect")) {
    type = "effect";
  } else if (lower.includes("radius") || lower.includes("rounded")) {
    type = "radius";
  } else if (lower.includes("font") || lower.includes("line-height") || lower.includes("letter-spacing") || lower.includes("text-size")) {
    type = "typography";
  } else if (lower.includes("spacing") || lower.includes("space") || lower.includes("gap") || lower.includes("padding") || lower.includes("margin") || lower.includes("inset")) {
    type = "spacing";
  }

  // "text" is ambiguous — could be colour or typography. Check value.
  if (!type && lower.includes("text")) {
    type = isColourValue(value) ? "color" : "typography";
  }

  // Value-based fallback for tokens with non-descriptive names
  if (!type) {
    if (isColourValue(value)) {
      type = "color";
    } else if (/^\d+(\.\d+)?(px|rem|em)$/.test(value)) {
      type = lower.includes("radius") || lower.includes("round") ? "radius" : "spacing";
    }
  }

  if (!type) return null;

  return {
    name,
    value,
    type,
    category: "semantic",
    cssVariable: name,
  };
}

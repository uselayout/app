import type { ExtractedToken, ExtractedTokens, TokenType } from "@/lib/types";

/**
 * Parse CSS custom property declarations from fenced CSS blocks in a layout.md file.
 * Returns structured tokens compatible with ExtractionResult.tokens.
 */
export function parseTokensFromLayoutMd(markdown: string): ExtractedTokens {
  const declarations = extractCSSDeclarations(markdown);
  const seen = new Map<string, ExtractedToken>();

  for (const { name, value } of declarations) {
    const token = classifyToken(name, value);
    if (token) {
      // Later declarations win (deduplication)
      seen.set(name, token);
    }
  }

  const colors: ExtractedToken[] = [];
  const typography: ExtractedToken[] = [];
  const spacing: ExtractedToken[] = [];
  const radius: ExtractedToken[] = [];
  const effects: ExtractedToken[] = [];

  for (const token of seen.values()) {
    switch (token.type) {
      case "color": colors.push(token); break;
      case "typography": typography.push(token); break;
      case "spacing": spacing.push(token); break;
      case "radius": radius.push(token); break;
      case "effect": effects.push(token); break;
    }
  }

  return { colors, typography, spacing, radius, effects };
}

interface CSSDeclaration {
  name: string;
  value: string;
}

/**
 * Extract all `--name: value;` declarations from fenced CSS blocks in markdown.
 */
function extractCSSDeclarations(markdown: string): CSSDeclaration[] {
  const declarations: CSSDeclaration[] = [];
  const fencedBlockRegex = /```css\s*\n([\s\S]*?)```/gi;
  const declarationRegex = /(--[\w-]+)\s*:\s*([^;]+);/g;

  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = fencedBlockRegex.exec(markdown)) !== null) {
    const blockContent = blockMatch[1];
    let declMatch: RegExpExecArray | null;
    while ((declMatch = declarationRegex.exec(blockContent)) !== null) {
      declarations.push({
        name: declMatch[1].trim(),
        value: declMatch[2].trim(),
      });
    }
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

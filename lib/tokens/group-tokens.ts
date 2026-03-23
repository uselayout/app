import type { ExtractedToken } from "@/lib/types";

export interface TokenGroup {
  label: string;
  tokens: ExtractedToken[];
}

interface GroupRule {
  label: string;
  patterns: string[];
}

const COLOR_GROUPS: GroupRule[] = [
  { label: "Primitives", patterns: ["primitive"] },
  { label: "Surfaces", patterns: ["bg", "surface", "elevated", "overlay", "panel", "app"] },
  { label: "Text", patterns: ["text", "label", "heading", "body", "placeholder", "caption"] },
  { label: "Borders", patterns: ["border", "divider", "outline", "separator", "stroke"] },
  { label: "Interactive", patterns: ["accent", "action", "hover", "focus", "selected", "active", "link", "btn", "button", "cta", "nav"] },
  { label: "Status", patterns: ["status", "success", "error", "warning", "info", "danger", "callout", "red", "green", "yellow", "blue"] },
];

const TYPOGRAPHY_GROUPS: GroupRule[] = [
  { label: "Font Families", patterns: ["font-family", "font-sans", "font-serif", "font-mono", "font-display", "font-body", "font-code"] },
  { label: "Sizes", patterns: ["size", "font-size"] },
  { label: "Properties", patterns: ["weight", "line-height", "letter-spacing", "tracking", "leading"] },
];

const SPACING_GROUPS: GroupRule[] = [
  { label: "Scale", patterns: ["space"] },
  { label: "Layout", patterns: ["gap", "padding", "margin", "inset"] },
];

const GROUP_RULES: Record<string, GroupRule[]> = {
  colors: COLOR_GROUPS,
  typography: TYPOGRAPHY_GROUPS,
  spacing: SPACING_GROUPS,
};

/** Minimum tokens in a section before sub-grouping kicks in. */
const MIN_TOKENS_FOR_GROUPING = 7;

/**
 * Group tokens by semantic purpose based on their CSS variable name.
 * Returns groups in a meaningful order with empty groups excluded.
 * If the section is small (≤6 tokens), returns a single flat group.
 */
export function groupTokensByPurpose(
  tokens: ExtractedToken[],
  tokenType: string
): TokenGroup[] {
  if (tokens.length <= MIN_TOKENS_FOR_GROUPING) {
    return [{ label: "", tokens }];
  }

  const rules = GROUP_RULES[tokenType];
  if (!rules) {
    return [{ label: "", tokens }];
  }

  const groups: Map<string, ExtractedToken[]> = new Map();
  const remaining: ExtractedToken[] = [];

  // Initialise group buckets in order
  for (const rule of rules) {
    groups.set(rule.label, []);
  }

  for (const token of tokens) {
    const name = (token.cssVariable ?? token.name).toLowerCase();
    let matched = false;

    for (const rule of rules) {
      if (rule.patterns.some((p) => name.includes(p))) {
        groups.get(rule.label)!.push(token);
        matched = true;
        break;
      }
    }

    if (!matched) {
      remaining.push(token);
    }
  }

  const result: TokenGroup[] = [];

  for (const rule of rules) {
    const groupTokens = groups.get(rule.label)!;
    if (groupTokens.length > 0) {
      result.push({ label: rule.label, tokens: groupTokens });
    }
  }

  if (remaining.length > 0) {
    result.push({ label: "Other", tokens: remaining });
  }

  // If everything ended up in one group, don't bother with sub-grouping
  if (result.length <= 1) {
    return [{ label: "", tokens }];
  }

  return result;
}

import type { ExtractedToken } from "@/lib/types";

export interface TokenGroup {
  label: string;
  tokens: ExtractedToken[];
}

/**
 * Well-known component prefixes. Tokens containing these (after the type prefix)
 * are classified as "Components" rather than by their suffix (bg, text, border).
 */
const COMPONENT_PREFIXES = [
  "nav", "card", "btn", "button", "input", "modal", "dialog",
  "sidebar", "header", "footer", "tab", "table", "badge",
  "tooltip", "dropdown", "menu", "code", "alert", "toast",
  "popover", "drawer", "chip", "tag", "avatar", "calendar",
];

/**
 * Check whether a token name is component-scoped.
 * e.g. --color-nav-bg, --color-card-text, --color-btn-primary-bg
 */
function isComponentToken(name: string): boolean {
  // Strip common prefixes to get the semantic part
  const stripped = name
    .replace(/^--/, "")
    .replace(/^color-/, "")
    .replace(/^primitive-/, "");
  return COMPONENT_PREFIXES.some((prefix) => stripped.startsWith(prefix + "-") || stripped === prefix);
}

interface GroupDef {
  label: string;
  /** Match function — receives the lowercase token name (with --) */
  match: (name: string) => boolean;
}

const COLOR_GROUPS: GroupDef[] = [
  {
    label: "Primitives",
    match: (n) => n.includes("primitive"),
  },
  {
    label: "Surfaces",
    match: (n) =>
      !isComponentToken(n) &&
      (n.includes("-bg") || n.includes("surface") || n.includes("elevated") || n.includes("overlay") || n.includes("panel")),
  },
  {
    label: "Text",
    match: (n) =>
      !isComponentToken(n) &&
      (n.includes("-text-") || n.endsWith("-text") || n.includes("label") || n.includes("heading") || n.includes("placeholder") || n.includes("caption")),
  },
  {
    label: "Borders",
    match: (n) =>
      !isComponentToken(n) &&
      (n.includes("border") || n.includes("divider") || n.includes("outline") || n.includes("separator") || n.includes("stroke")),
  },
  {
    label: "Interactive",
    match: (n) =>
      !isComponentToken(n) &&
      (n.includes("accent") || n.includes("action") || n.includes("link") || n.includes("focus") || n.includes("selected") || n.includes("cta")),
  },
  {
    label: "Status",
    match: (n) =>
      n.includes("status") || n.includes("success") || n.includes("error") || n.includes("warning") || n.includes("info") || n.includes("danger") || n.includes("callout"),
  },
  {
    label: "Components",
    match: (n) => isComponentToken(n),
  },
];

const TYPOGRAPHY_GROUPS: GroupDef[] = [
  {
    label: "Font Families",
    match: (n) => n.includes("font-family") || n.includes("font-sans") || n.includes("font-serif") || n.includes("font-mono") || n.includes("font-display") || n.includes("font-body") || n.includes("font-code"),
  },
  {
    label: "Sizes",
    match: (n) => n.includes("size") || n.includes("font-size"),
  },
  {
    label: "Properties",
    match: (n) => n.includes("weight") || n.includes("line-height") || n.includes("letter-spacing") || n.includes("tracking") || n.includes("leading"),
  },
];

const SPACING_GROUPS: GroupDef[] = [
  {
    label: "Scale",
    match: (n) => n.includes("space"),
  },
  {
    label: "Layout",
    match: (n) => n.includes("gap") || n.includes("padding") || n.includes("margin") || n.includes("inset"),
  },
];

const GROUP_RULES: Record<string, GroupDef[]> = {
  colors: COLOR_GROUPS,
  typography: TYPOGRAPHY_GROUPS,
  spacing: SPACING_GROUPS,
};

/** Minimum tokens in a section before sub-grouping kicks in. */
const MIN_TOKENS_FOR_GROUPING = 7;

/**
 * Check if a token value looks like junk (transition shorthand, animation, etc.)
 * rather than a real colour/spacing/typography value.
 */
function isJunkToken(token: ExtractedToken): boolean {
  const v = token.value.toLowerCase();
  // Transition shorthands, animation values
  if (v.includes("var(--duration") || v.includes("var(--ease") || v.includes("cubic-bezier")) return true;
  // Very long values are likely shorthand properties, not tokens
  if (v.length > 80) return true;
  return false;
}

/**
 * Group tokens by semantic purpose based on their CSS variable name.
 * Returns groups in a meaningful order with empty groups excluded.
 * If the section is small (≤6 tokens), returns a single flat group.
 */
export function groupTokensByPurpose(
  tokens: ExtractedToken[],
  tokenType: string
): TokenGroup[] {
  // Filter out junk tokens
  const cleanTokens = tokens.filter((t) => !isJunkToken(t));

  if (cleanTokens.length <= MIN_TOKENS_FOR_GROUPING) {
    return [{ label: "", tokens: cleanTokens }];
  }

  const rules = GROUP_RULES[tokenType];
  if (!rules) {
    return [{ label: "", tokens: cleanTokens }];
  }

  const groups: Map<string, ExtractedToken[]> = new Map();
  const remaining: ExtractedToken[] = [];

  for (const rule of rules) {
    groups.set(rule.label, []);
  }

  for (const token of cleanTokens) {
    const name = (token.cssVariable ?? token.name).toLowerCase();
    let matched = false;

    for (const rule of rules) {
      if (rule.match(name)) {
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
    return [{ label: "", tokens: cleanTokens }];
  }

  return result;
}

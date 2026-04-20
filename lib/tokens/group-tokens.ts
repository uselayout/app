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
  /** Match function — receives the full token so rules can inspect name, groupName, etc. */
  match: (token: ExtractedToken) => boolean;
}

/**
 * Strip common vendor/framework prefixes from token names for grouping.
 * e.g. "fides-overlay-background-color" → "background-color"
 */
function stripVendorPrefix(name: string): string {
  return name.replace(/^--(fides-overlay-|chakra-|mantine-|radix-|shadcn-|ant-|mui-)/, "--");
}

/**
 * Text-hierarchy prefixes. These signal "colour applied to text of rank X",
 * NOT "brand colour". Sites like wise.com define `--color-content-primary`
 * (primary text, navy blue) — the word "primary" means first-rank text, not
 * brand. The Brand rule must not claim these.
 */
const TEXT_HIERARCHY_PREFIXES = [
  "content-", "text-", "heading-", "label-", "caption-",
  "body-", "on-", "foreground-", "fg-",
];

function strippedSemanticName(n: string): string {
  return stripVendorPrefix(n).replace(/^--/, "").replace(/^color-/, "");
}

function looksLikeTextHierarchy(n: string): boolean {
  const stripped = strippedSemanticName(n);
  return TEXT_HIERARCHY_PREFIXES.some((p) => stripped.startsWith(p));
}

const COLOR_GROUPS: GroupDef[] = [
  {
    label: "Primitives",
    match: (t) => (t.cssVariable ?? t.name).toLowerCase().includes("primitive"),
  },
  // Brand & Primary first — the most important tokens for identity
  {
    label: "Brand",
    match: (t) => {
      // Mined CTA tokens are explicitly tagged; they always land in Brand.
      if (t.groupName === "Brand") return true;
      const n = (t.cssVariable ?? t.name).toLowerCase();
      if (isComponentToken(n)) return false;
      // Text-hierarchy tokens describe rank, not brand. Demote.
      if (looksLikeTextHierarchy(n)) return false;
      const s = stripVendorPrefix(n);
      // Named brand tokens (primary, secondary, tertiary, brand, accent)
      if (s.includes("primary") || s.includes("secondary") || s.includes("tertiary") || s.includes("brand") || s.includes("accent")) return true;
      // Single-word colour names (e.g. --coral, --midnight) — likely brand colours
      const stripped = n.replace(/^--/, "");
      if (stripped.split("-").length > 2) return false;
      if (COMPONENT_PREFIXES.some((p) => stripped.startsWith(p))) return false;
      return stripped.length >= 3 && stripped.length <= 20 && /^[a-z]+(Light|Dark|Medium)?$/i.test(stripped);
    },
  },
  {
    label: "Surfaces",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      const s = stripVendorPrefix(n);
      return !isComponentToken(n) &&
        (s.includes("background") || s.includes("-bg") || s.includes("surface") || s.includes("elevated") || s.includes("panel"));
    },
  },
  {
    label: "Text",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      if (isComponentToken(n)) return false;
      if (looksLikeTextHierarchy(n)) return true;
      const s = stripVendorPrefix(n);
      return s.includes("-text-") || s.endsWith("-text") || s.includes("font-color") || s.includes("placeholder");
    },
  },
  {
    label: "Borders",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      const s = stripVendorPrefix(n);
      return !isComponentToken(n) &&
        (s.includes("border") || s.includes("divider") || s.includes("outline") || s.includes("separator") || s.includes("stroke"));
    },
  },
  {
    label: "Interactive",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      return !isComponentToken(n) &&
        (n.includes("action") || n.includes("link") || n.includes("focus") || n.includes("selected") || n.includes("cta"));
    },
  },
  {
    label: "Status",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      const s = stripVendorPrefix(n);
      return s.includes("status") || s.includes("success") || s.includes("error") || s.includes("warning") || s.includes("info") || s.includes("danger") || s.includes("callout");
    },
  },
  {
    label: "Foreground",
    match: (t) => (t.cssVariable ?? t.name).toLowerCase().includes("foreground"),
  },
  {
    label: "Palette",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      const stripped = n.replace(/^--/, "");
      return /^(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|grey|zinc|neutral|stone|magenta|white|black|current)(-\d+)?$/.test(stripped);
    },
  },
  {
    label: "Components",
    match: (t) => isComponentToken((t.cssVariable ?? t.name).toLowerCase()),
  },
];

const TYPOGRAPHY_GROUPS: GroupDef[] = [
  {
    label: "Font Families",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      return n.includes("font-family") || n.includes("font-sans") || n.includes("font-serif") || n.includes("font-mono") || n.includes("font-display") || n.includes("font-body") || n.includes("font-code");
    },
  },
  {
    label: "Display Sizes",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      return n.includes("display") && (n.includes("size") || n.includes("font"));
    },
  },
  {
    label: "Heading Sizes",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      return n.includes("heading") && (n.includes("size") || n.includes("font"));
    },
  },
  {
    label: "Body Sizes",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      return (n.includes("body") || n.includes("paragraph") || n.includes("description")) && (n.includes("size") || n.includes("font"));
    },
  },
  {
    label: "Sizes",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      return n.includes("size") || n.includes("font-size");
    },
  },
  {
    label: "Properties",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      return n.includes("weight") || n.includes("line-height") || n.includes("letter-spacing") || n.includes("tracking") || n.includes("leading");
    },
  },
];

const SPACING_GROUPS: GroupDef[] = [
  {
    label: "Scale",
    match: (t) => (t.cssVariable ?? t.name).toLowerCase().includes("space"),
  },
  {
    label: "Layout",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      return n.includes("gap") || n.includes("padding") || n.includes("margin") || n.includes("inset");
    },
  },
];

const EFFECTS_GROUPS: GroupDef[] = [
  {
    label: "Shadows",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      return n.includes("shadow") || n.includes("elevation");
    },
  },
  {
    label: "Z-Index",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      return n.includes("z-") || n.includes("z-index") || n.includes("layer");
    },
  },
  {
    label: "Opacity",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      return n.includes("opacity") || n.includes("alpha");
    },
  },
  {
    label: "Transitions",
    match: (t) => {
      const n = (t.cssVariable ?? t.name).toLowerCase();
      return n.includes("duration") || n.includes("ease") || n.includes("transition") || n.includes("delay");
    },
  },
];

const GROUP_RULES: Record<string, GroupDef[]> = {
  colors: COLOR_GROUPS,
  typography: TYPOGRAPHY_GROUPS,
  spacing: SPACING_GROUPS,
  effects: EFFECTS_GROUPS,
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
    let matched = false;

    for (const rule of rules) {
      if (rule.match(token)) {
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

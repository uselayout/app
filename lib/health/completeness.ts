/**
 * layout.md completeness and quality checker.
 *
 * Analyses a layout.md string against the expected section structure
 * and returns a weighted score with actionable gaps.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SectionScore {
  section: string;
  score: number; // 0-100
  found: string[]; // what was found
  missing: string[]; // what's missing/suggested
}

export interface CompletenessReport {
  totalScore: number; // 0-100 weighted average
  sections: SectionScore[];
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// Section checkers
// ---------------------------------------------------------------------------

interface SectionCheck {
  name: string;
  /** Weight used when computing the weighted average (must sum to 1.0 across all checks). */
  weight: number;
  /** Heading patterns that identify this section (case-insensitive). */
  headingPatterns: RegExp[];
  /** Sub-element checks run against the section body text. */
  checks: SubCheck[];
}

interface SubCheck {
  label: string;
  /** Returns `true` when the sub-element is present in `sectionBody`. */
  test: (sectionBody: string) => boolean;
  /** Suggestion shown when this sub-element is missing. */
  suggestion: string;
}

// Helpers -------------------------------------------------------------------

const hexPattern = /#[0-9a-fA-F]{3,8}\b/;
const cssVarPattern = /--[\w-]+/;
const cssVarDeclarationPattern = /--[\w-]+:\s*.+/;
const codeBlockPattern = /```[\s\S]*?```/;
const bulletPointPattern = /^[\s]*[-*]\s/m;

function containsCount(body: string, pattern: RegExp): number {
  return (body.match(new RegExp(pattern.source, "g" + (pattern.flags.includes("i") ? "i" : ""))) ?? []).length;
}

function hasMinOccurrences(body: string, pattern: RegExp, min: number): boolean {
  return containsCount(body, pattern) >= min;
}

// ---------------------------------------------------------------------------
// Section definitions
// ---------------------------------------------------------------------------

const SECTION_CHECKS: SectionCheck[] = [
  {
    name: "Quick Reference",
    weight: 0.15,
    headingPatterns: [/^#{1,3}\s*0[.)]\s*quick\s*reference/im],
    checks: [
      {
        label: "Bullet-point rules",
        test: (b) => hasMinOccurrences(b, bulletPointPattern, 3),
        suggestion: "Add at least 3 bullet-point rules summarising the most critical design constraints.",
      },
      {
        label: "Code block with tokens",
        test: (b) => codeBlockPattern.test(b) && cssVarPattern.test(b),
        suggestion: "Include a fenced code block containing core CSS custom property tokens.",
      },
      {
        label: "NEVER rules",
        test: (b) => /\bNEVER\b/.test(b),
        suggestion: "Add explicit NEVER prohibitions (e.g. 'NEVER use hardcoded hex colours').",
      },
      {
        label: "Component example",
        test: (b) => /```(tsx?|jsx?)/.test(b),
        suggestion: "Include one real TSX/JSX component example showing correct token usage.",
      },
      {
        label: "Reasonable length (50-75 lines)",
        test: (b) => {
          const lines = b.split("\n").length;
          return lines >= 30 && lines <= 120;
        },
        suggestion: "Aim for 50-75 lines — concise enough to copy-paste into CLAUDE.md or .cursorrules.",
      },
    ],
  },
  {
    name: "Colours",
    weight: 0.2,
    headingPatterns: [
      /^#{1,3}\s*(?:\d[.)]?\s*)?colou?r/im,
    ],
    checks: [
      {
        label: "Hex values",
        test: (b) => hasMinOccurrences(b, hexPattern, 3),
        suggestion: "Include at least 3 hex colour values (e.g. #1A1A2E, #E94560).",
      },
      {
        label: "Semantic colour names",
        test: (b) =>
          /(?:primary|secondary|accent|surface|background|foreground|muted|destructive|warning|success|error|info)/i.test(b),
        suggestion: "Use semantic colour names (primary, surface, accent, destructive, etc.) instead of or alongside visual names.",
      },
      {
        label: "CSS variable declarations",
        test: (b) => hasMinOccurrences(b, cssVarDeclarationPattern, 2),
        suggestion: "Declare colours as CSS custom properties (e.g. --color-primary: #6366F1;).",
      },
      {
        label: "Dark/light mode variants",
        test: (b) => /dark|light|mode|theme|variant/i.test(b),
        suggestion: "Document dark/light mode variants or explicitly state the design is single-mode.",
      },
      {
        label: "Usage descriptions",
        test: (b) => /\/\*.*\*\//.test(b) || /\|\s*usage\s*\|/i.test(b) || /:\s*used\s*(for|on|in)/i.test(b),
        suggestion: "Add inline usage descriptions for each colour token (e.g. /* Primary CTA backgrounds */).",
      },
    ],
  },
  {
    name: "Typography",
    weight: 0.15,
    headingPatterns: [
      /^#{1,3}\s*(?:\d[.)]?\s*)?typography/im,
    ],
    checks: [
      {
        label: "Font families",
        test: (b) => /font-family|font.family|typeface|geist|inter|roboto|helvetica|arial|sans-serif|serif|monospace/i.test(b),
        suggestion: "Specify font families with full fallback stacks.",
      },
      {
        label: "Font sizes",
        test: (b) => /font-size|text-(?:xs|sm|base|lg|xl|\d)|(?:\d+(?:\.\d+)?(?:px|rem|em))/i.test(b),
        suggestion: "Document the complete font size scale with exact values (px or rem).",
      },
      {
        label: "Font weights",
        test: (b) => /font-weight|weight|(?:regular|medium|semibold|bold|\b[1-9]00\b)/i.test(b),
        suggestion: "List available font weights with their numeric values (400, 500, 600, 700).",
      },
      {
        label: "Line heights",
        test: (b) => /line-height|line.height|leading/i.test(b),
        suggestion: "Include line-height values for each type scale step.",
      },
      {
        label: "Letter spacing",
        test: (b) => /letter-spacing|letter.spacing|tracking/i.test(b),
        suggestion: "Document letter-spacing values, especially for headings and uppercase text.",
      },
      {
        label: "Composite token groups",
        test: (b) => {
          // At least one group that bundles multiple properties together
          const hasMultiProp = /font-family[\s\S]{0,200}font-size[\s\S]{0,200}font-weight/i.test(b) ||
            /font-size[\s\S]{0,200}line-height[\s\S]{0,200}font-weight/i.test(b);
          return hasMultiProp;
        },
        suggestion: "Group typography tokens as composites (family + size + weight + line-height + letter-spacing together).",
      },
    ],
  },
  {
    name: "Spacing",
    weight: 0.1,
    headingPatterns: [
      /^#{1,3}\s*(?:\d[.)]?\s*)?spacing/im,
      /^#{1,3}\s*(?:\d[.)]?\s*)?spacing\s*(?:&|and)\s*layout/im,
    ],
    checks: [
      {
        label: "Scale values",
        test: (b) => {
          // Look for a numeric spacing scale (e.g. 4, 8, 12, 16, 24, 32)
          const numbers = b.match(/\b(?:4|8|12|16|20|24|32|40|48|64)(?:px)?\b/g) ?? [];
          return numbers.length >= 3;
        },
        suggestion: "Define a complete spacing scale (e.g. 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px).",
      },
      {
        label: "Base unit",
        test: (b) => /base\s*unit|base:\s*\d|4px\s*grid|8px\s*grid/i.test(b),
        suggestion: "Declare the base spacing unit (e.g. 4px grid or 8px grid).",
      },
      {
        label: "CSS variable declarations",
        test: (b) => /--(?:space|spacing|gap|padding|margin)/.test(b),
        suggestion: "Define spacing as CSS custom properties (e.g. --space-4: 1rem;).",
      },
      {
        label: "Usage guidelines",
        test: (b) => /padding|margin|gap|between|inside|outside|stack|inline/i.test(b),
        suggestion: "Add usage guidelines explaining when to use each spacing value.",
      },
    ],
  },
  {
    name: "Components",
    weight: 0.25,
    headingPatterns: [
      /^#{1,3}\s*(?:\d[.)]?\s*)?component/im,
    ],
    checks: [
      {
        label: "Component names",
        test: (b) => {
          // Look for named components (PascalCase or headings with component-like names)
          const pascal = b.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g) ?? [];
          const componentKeywords = /button|input|card|modal|dialog|dropdown|select|badge|avatar|toast|alert|nav|header|footer|tab/i;
          return pascal.length >= 2 || componentKeywords.test(b);
        },
        suggestion: "Document at least 5 key components by name (Button, Card, Input, Modal, etc.).",
      },
      {
        label: "Props/variants",
        test: (b) => /variant|size|prop|attribute/i.test(b),
        suggestion: "Document component variants (e.g. primary, secondary, ghost) and size props.",
      },
      {
        label: "States",
        test: (b) => {
          const states = ["default", "hover", "focus", "active", "disabled", "loading", "error"];
          const found = states.filter((s) => new RegExp(`\\b${s}\\b`, "i").test(b));
          return found.length >= 3;
        },
        suggestion: "Document component states: default, hover, focus, active, disabled, loading, error.",
      },
      {
        label: "Code examples",
        test: (b) => /```(tsx?|jsx?|html)/.test(b),
        suggestion: "Include at least one TSX/JSX code example per key component showing correct token usage.",
      },
      {
        label: "Token-to-property mappings",
        test: (b) => cssVarPattern.test(b) || /var\(--/.test(b),
        suggestion: "Map CSS custom properties to component properties (e.g. background: var(--color-primary)).",
      },
    ],
  },
  {
    name: "Anti-patterns",
    weight: 0.15,
    headingPatterns: [
      /^#{1,3}\s*(?:\d[.)]?\s*)?anti.?pattern/im,
      /^#{1,3}\s*(?:\d[.)]?\s*)?constraint/im,
    ],
    checks: [
      {
        label: "Prohibition keywords",
        test: (b) => /\b(?:don'?t|avoid|never|do\s+not|must\s+not|prohibited)\b/i.test(b),
        suggestion: "Use strong prohibition keywords (NEVER, DON'T, AVOID) for anti-pattern rules.",
      },
      {
        label: "Multiple rules",
        test: (b) => {
          const rulePatterns = b.match(/(?:^|\n)\s*(?:\d+[.)]|-|\*)\s+/g) ?? [];
          return rulePatterns.length >= 3;
        },
        suggestion: "Document at least 5 anti-patterns as a numbered or bulleted list.",
      },
      {
        label: "Hardcoded colours warning",
        test: (b) => /hardcod|hex|#[0-9a-fA-F]/i.test(b),
        suggestion: "Warn against hardcoded colour values — require CSS variable usage.",
      },
      {
        label: "Explanation of why",
        test: (b) => /\bbecause\b|\bwhy\b|\bfails?\b|\bresult/i.test(b),
        suggestion: "Explain WHY each anti-pattern causes problems (failure narrative format).",
      },
      {
        label: "Correct alternative shown",
        test: (b) => /instead|correct|prefer|use\s+(?:this|the)|do\s+this/i.test(b),
        suggestion: "Show the correct alternative for each anti-pattern (Rule -> Why it fails -> What to do instead).",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Section extraction
// ---------------------------------------------------------------------------

/**
 * Extracts the body text of a section identified by its heading pattern.
 * Returns the text from just after the heading to the next heading of equal
 * or higher level, or end-of-string.
 */
function extractSectionBody(md: string, headingPatterns: RegExp[]): string | null {
  for (const pattern of headingPatterns) {
    const match = pattern.exec(md);
    if (!match) continue;

    const headingStart = match.index;
    const headingLine = match[0];
    const level = (headingLine.match(/^#+/) ?? ["##"])[0].length;

    // Find the end: next heading of same or higher level
    const afterHeading = md.slice(headingStart + headingLine.length);
    const nextHeadingPattern = new RegExp(`^#{1,${level}}\\s`, "m");
    const nextMatch = nextHeadingPattern.exec(afterHeading);
    const body = nextMatch
      ? afterHeading.slice(0, nextMatch.index)
      : afterHeading;

    return body;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Also check for anti-pattern content scattered across the whole document
// (not just in a dedicated section)
// ---------------------------------------------------------------------------

function checkAntiPatternsGlobally(md: string): { found: boolean; locations: string[] } {
  const locations: string[] = [];
  if (/\bNEVER\b/.test(md)) locations.push("NEVER rules found in document");
  if (/\bdon'?t\b/i.test(md)) locations.push("DON'T rules found in document");
  if (/\bavoid\b/i.test(md)) locations.push("AVOID rules found in document");
  return { found: locations.length > 0, locations };
}

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

export function analyseCompleteness(layoutMd: string): CompletenessReport {
  const sections: SectionScore[] = [];
  const suggestions: string[] = [];

  for (const sectionDef of SECTION_CHECKS) {
    const body = extractSectionBody(layoutMd, sectionDef.headingPatterns);
    const found: string[] = [];
    const missing: string[] = [];

    if (!body) {
      // Section not found at all
      missing.push(`Section "${sectionDef.name}" not found — add a heading matching the expected pattern.`);
      for (const check of sectionDef.checks) {
        missing.push(check.suggestion);
      }

      // Special case: anti-patterns may be scattered throughout the doc
      if (sectionDef.name === "Anti-patterns") {
        const global = checkAntiPatternsGlobally(layoutMd);
        if (global.found) {
          found.push(...global.locations);
        }
      }

      const sectionScore = found.length > 0 ? 10 : 0;
      sections.push({ section: sectionDef.name, score: sectionScore, found, missing });
      suggestions.push(`Add a "${sectionDef.name}" section to your layout.md.`);
      continue;
    }

    // Section exists — run sub-checks
    found.push(`Section "${sectionDef.name}" heading found`);

    let passedChecks = 0;
    for (const check of sectionDef.checks) {
      if (check.test(body)) {
        found.push(check.label);
        passedChecks++;
      } else {
        missing.push(check.suggestion);
      }
    }

    const sectionScore = sectionDef.checks.length > 0
      ? Math.round((passedChecks / sectionDef.checks.length) * 100)
      : 100;

    sections.push({ section: sectionDef.name, score: sectionScore, found, missing });

    // Add top-level suggestions for low-scoring sections
    if (sectionScore < 50) {
      suggestions.push(
        `"${sectionDef.name}" section scores ${sectionScore}/100 — ${missing[0] ?? "add more detail"}.`
      );
    }
  }

  // Weighted average
  const totalScore = Math.round(
    sections.reduce((sum, s, i) => sum + s.score * SECTION_CHECKS[i].weight, 0)
  );

  // General suggestions
  if (layoutMd.length < 500) {
    suggestions.push("layout.md is very short — aim for at least 200 lines of structured content.");
  }
  if (!codeBlockPattern.test(layoutMd)) {
    suggestions.push("No code blocks found — include fenced code blocks with CSS tokens and component examples.");
  }

  return { totalScore, sections, suggestions };
}

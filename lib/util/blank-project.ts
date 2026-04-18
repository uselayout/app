import type { ExtractionResult } from "@/lib/types";

// Seed layout.md for a "Start Blank" project. Must include the exact
// "CORE TOKENS" marker line in a fenced CSS block with unicode em-dashes —
// the + Add token button silently no-ops if the marker is missing. See
// lib/tokens/add-remove-token.ts:16 for the regex.
//
// Length is ~750 chars, safely above the 50-char explore-route gate.
export const BLANK_LAYOUT_MD_TEMPLATE = `# Design System

> Manually authored design system. Edit this file to describe tokens, components, and rules.

## 0. Quick Reference

- Define 3-5 critical design rules here so AI coding agents see them first.
- State what this design is — and what it rejects.

\`\`\`css
/* ── CORE TOKENS ── */
:root {
  /* Colours */

  /* Typography */

  /* Spacing */

  /* Radius */
}
\`\`\`

## 1. Design Direction & Philosophy

Describe personality, aesthetic intent, and what this design explicitly avoids.

## 2. Colour System

Document primitive, semantic, and component colour tokens.

## 3. Typography System

Composite token groups (font-family + size + weight + line-height + letter-spacing).

## 4. Spacing & Layout

Base unit (typically 4px or 8px) and the full spacing scale.

## 6. Component Patterns

Describe reusable component rules and when to apply them.

## 9. Anti-Patterns & Constraints

- NEVER hardcode colour values; always use tokens.
- NEVER use arbitrary spacing off the base grid.
`;

/**
 * Empty-but-present extractionData scaffold for blank projects. Matches the
 * exact shape that addToken() falls back to (lib/store/project.ts:538-549).
 * Using this means every code path that reads extractionData?.tokens.colors
 * is already exercised and needs no defensive null-guards.
 */
export function createBlankExtractionResult(): ExtractionResult {
  return {
    sourceType: "manual",
    sourceName: "Manual design system",
    tokens: {
      colors: [],
      typography: [],
      spacing: [],
      radius: [],
      effects: [],
      motion: [],
    },
    components: [],
    screenshots: [],
    fonts: [],
    animations: [],
    librariesDetected: {},
    cssVariables: {},
    computedStyles: {},
  };
}

import type { ImportedNodeData } from "./import";
import type { FigmaChange } from "@/lib/types";

interface DesignTokens {
  colours: Map<string, string>;
  spacing: Map<string, number>;
  typography: Map<string, { family: string; size: number; weight: number }>;
}

/**
 * Compare imported Figma node data against the tokens defined in layout.md.
 * Returns a list of changes where the Figma values differ from the design system.
 */
export function diffFigmaAgainstLayoutMd(
  imported: ImportedNodeData,
  layoutMd: string
): FigmaChange[] {
  const tokens = parseLayoutMdTokens(layoutMd);
  const changes: FigmaChange[] = [];

  for (const colour of imported.colours) {
    const match = findClosestColourToken(colour.hex, tokens.colours);
    if (match && match.hex.toUpperCase() !== colour.hex.toUpperCase()) {
      changes.push({
        type: "colour",
        property: colour.property,
        before: match.hex,
        after: colour.hex,
        designTokenMatch: match.tokenName,
        accepted: false,
      });
    }
  }

  for (const sp of imported.spacing) {
    const match = findClosestSpacingToken(sp.value, tokens.spacing);
    if (match && match.value !== sp.value) {
      changes.push({
        type: "spacing",
        property: sp.property,
        before: `${match.value}px`,
        after: `${sp.value}px`,
        designTokenMatch: match.tokenName,
        accepted: false,
      });
    }
  }

  for (const typo of imported.typography) {
    const match = findClosestTypographyToken(typo, tokens.typography);
    if (match) {
      const hasDiff =
        match.value.family !== typo.fontFamily ||
        match.value.size !== typo.fontSize ||
        match.value.weight !== typo.fontWeight;

      if (hasDiff) {
        changes.push({
          type: "typography",
          property: typo.property,
          before: `${match.value.family} ${match.value.weight} ${match.value.size}px`,
          after: `${typo.fontFamily} ${typo.fontWeight} ${typo.fontSize}px`,
          designTokenMatch: match.tokenName,
          accepted: false,
        });
      }
    }
  }

  return changes;
}

// ─── Token parsing from layout.md ────────────────────────────────────────────

function parseLayoutMdTokens(layoutMd: string): DesignTokens {
  const colours = new Map<string, string>();
  const spacing = new Map<string, number>();
  const typography = new Map<string, { family: string; size: number; weight: number }>();

  const cssVarPattern = /(--.+?):\s*(.+?)(?:;|\n|$)/g;
  let match: RegExpExecArray | null;

  while ((match = cssVarPattern.exec(layoutMd)) !== null) {
    const [, tokenName, rawValue] = match;
    const value = rawValue.trim();

    if (/^#[0-9a-fA-F]{3,8}$/.test(value)) {
      colours.set(tokenName, normaliseHex(value));
      continue;
    }

    const rgbMatch = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]).toString(16).padStart(2, "0");
      const g = parseInt(rgbMatch[2]).toString(16).padStart(2, "0");
      const b = parseInt(rgbMatch[3]).toString(16).padStart(2, "0");
      colours.set(tokenName, `#${r}${g}${b}`.toUpperCase());
      continue;
    }

    const pxMatch = value.match(/^(\d+(?:\.\d+)?)px$/);
    if (pxMatch) {
      spacing.set(tokenName, parseFloat(pxMatch[1]));
      continue;
    }

    const remMatch = value.match(/^(\d+(?:\.\d+)?)rem$/);
    if (remMatch) {
      spacing.set(tokenName, parseFloat(remMatch[1]) * 16);
    }
  }

  const fontPattern = /font-family:\s*["']?([^"';\n]+)/gi;
  while ((match = fontPattern.exec(layoutMd)) !== null) {
    const family = match[1].trim().split(",")[0].trim();
    typography.set(`--font-${family.toLowerCase().replace(/\s+/g, "-")}`, {
      family,
      size: 16,
      weight: 400,
    });
  }

  return { colours, spacing, typography };
}

// ─── Token matching ──────────────────────────────────────────────────────────

function findClosestColourToken(
  hex: string,
  tokens: Map<string, string>
): { tokenName: string; hex: string } | null {
  const normalised = hex.toUpperCase();

  for (const [name, tokenHex] of tokens) {
    if (tokenHex.toUpperCase() === normalised) {
      return { tokenName: name, hex: tokenHex };
    }
  }

  let closest: { tokenName: string; hex: string; dist: number } | null = null;
  const targetRgb = hexToRgb(normalised);
  if (!targetRgb) return null;

  for (const [name, tokenHex] of tokens) {
    const rgb = hexToRgb(tokenHex);
    if (!rgb) continue;
    const dist = Math.sqrt(
      (targetRgb.r - rgb.r) ** 2 +
        (targetRgb.g - rgb.g) ** 2 +
        (targetRgb.b - rgb.b) ** 2
    );
    if (dist < 50 && (!closest || dist < closest.dist)) {
      closest = { tokenName: name, hex: tokenHex, dist };
    }
  }

  return closest ? { tokenName: closest.tokenName, hex: closest.hex } : null;
}

function findClosestSpacingToken(
  value: number,
  tokens: Map<string, number>
): { tokenName: string; value: number } | null {
  let closest: { tokenName: string; value: number; diff: number } | null = null;

  for (const [name, tokenValue] of tokens) {
    const diff = Math.abs(tokenValue - value);
    if (diff < 8 && (!closest || diff < closest.diff)) {
      closest = { tokenName: name, value: tokenValue, diff };
    }
  }

  return closest ? { tokenName: closest.tokenName, value: closest.value } : null;
}

function findClosestTypographyToken(
  typo: { fontFamily: string; fontSize: number; fontWeight: number },
  tokens: Map<string, { family: string; size: number; weight: number }>
): { tokenName: string; value: { family: string; size: number; weight: number } } | null {
  for (const [name, value] of tokens) {
    if (
      typo.fontFamily.toLowerCase().includes(value.family.toLowerCase()) ||
      value.family.toLowerCase().includes(typo.fontFamily.toLowerCase())
    ) {
      return { tokenName: name, value };
    }
  }
  return null;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function normaliseHex(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length === 3) {
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toUpperCase();
  }
  return `#${h.slice(0, 6)}`.toUpperCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "");
  if (h.length < 6) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Apply accepted changes back to the layout.md content.
 */
export function applyChangesToLayoutMd(
  layoutMd: string,
  changes: FigmaChange[]
): string {
  let updated = layoutMd;

  for (const change of changes) {
    if (!change.accepted || !change.designTokenMatch) continue;

    const tokenName = change.designTokenMatch;
    const escapedToken = tokenName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if (change.type === "colour" || change.type === "spacing") {
      const escapedBefore = change.before.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(
        `(${escapedToken}:\\s*)${escapedBefore}`,
        "gi"
      );
      updated = updated.replace(pattern, `$1${change.after}`);
    }
  }

  return updated;
}

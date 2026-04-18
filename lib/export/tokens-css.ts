import type { ExtractedTokens, ExtractedToken } from "@/lib/types";

function tokenToCssLine(token: ExtractedToken, prefix: string): string {
  const varName =
    token.cssVariable ||
    `--${prefix}-${token.name.toLowerCase().replace(/[/\s]+/g, "-")}`;
  // Use reference (alias) if available, otherwise the resolved value
  const value = token.reference || token.value;
  return `  ${varName}: ${value};`;
}

function emitTokenBlock(
  tokens: ExtractedToken[],
  comment: string,
  prefix: string,
  lines: string[]
): void {
  // Only include tokens without a mode (default/root tokens)
  const rootTokens = tokens.filter((t) => !t.mode);
  if (rootTokens.length === 0) return;
  lines.push(`  /* === ${comment} === */`);
  for (const token of rootTokens) {
    lines.push(tokenToCssLine(token, prefix));
  }
  lines.push("");
}

export function generateTokensCss(tokens: ExtractedTokens): string {
  // Blank projects: don't emit an empty `:root {}` file — the export route
  // skips this entry when we return an empty string.
  const total =
    tokens.colors.length +
    tokens.typography.length +
    tokens.spacing.length +
    tokens.radius.length +
    tokens.effects.length +
    (tokens.motion?.length ?? 0);
  if (total === 0) return "";

  const lines: string[] = [":root {"];

  emitTokenBlock(tokens.colors, "COLOURS", "color", lines);
  emitTokenBlock(tokens.typography, "TYPOGRAPHY", "type", lines);
  emitTokenBlock(tokens.spacing, "SPACING", "space", lines);
  emitTokenBlock(tokens.radius, "BORDER RADIUS", "radius", lines);
  emitTokenBlock(tokens.effects, "EFFECTS", "effect", lines);
  emitTokenBlock(tokens.motion ?? [], "MOTION", "motion", lines);

  lines.push("}");

  // Collect all tokens with mode fields across all categories
  const allTokens: ExtractedToken[] = [
    ...tokens.colors,
    ...tokens.typography,
    ...tokens.spacing,
    ...tokens.radius,
    ...tokens.effects,
    ...(tokens.motion ?? []),
  ];

  const modeTokens = allTokens.filter((t) => t.mode);
  if (modeTokens.length > 0) {
    // Group by mode
    const byMode = new Map<string, ExtractedToken[]>();
    for (const token of modeTokens) {
      const mode = token.mode!;
      const existing = byMode.get(mode);
      if (existing) {
        existing.push(token);
      } else {
        byMode.set(mode, [token]);
      }
    }

    for (const [mode, modeGroup] of byMode) {
      lines.push("");
      lines.push(`[data-theme="${mode}"] {`);
      for (const token of modeGroup) {
        const varName =
          token.cssVariable ||
          `--${token.type === "color" ? "color" : "space"}-${token.name.toLowerCase().replace(/[/\s]+/g, "-")}`;
        lines.push(`  ${varName}: ${token.value};`);
      }
      lines.push("}");

      // Also emit @media block for dark mode tokens
      if (mode === "dark") {
        lines.push("");
        lines.push("@media (prefers-color-scheme: dark) {");
        lines.push("  :root {");
        for (const token of modeGroup) {
          const varName =
            token.cssVariable ||
            `--${token.type === "color" ? "color" : "space"}-${token.name.toLowerCase().replace(/[/\s]+/g, "-")}`;
          lines.push(`    ${varName}: ${token.value};`);
        }
        lines.push("  }");
        lines.push("}");
      }
    }
  }

  return lines.join("\n");
}

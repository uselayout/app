import type { ExtractedTokens } from "@/lib/types";

export function generateTokensCss(tokens: ExtractedTokens): string {
  const lines: string[] = [":root {"];

  if (tokens.colors.length > 0) {
    lines.push("  /* === COLOURS === */");
    for (const token of tokens.colors) {
      const varName = token.cssVariable || `--color-${token.name.toLowerCase().replace(/[/\s]+/g, "-")}`;
      lines.push(`  ${varName}: ${token.value};`);
    }
    lines.push("");
  }

  if (tokens.typography.length > 0) {
    lines.push("  /* === TYPOGRAPHY === */");
    for (const token of tokens.typography) {
      const varName = token.cssVariable || `--type-${token.name.toLowerCase().replace(/[/\s]+/g, "-")}`;
      lines.push(`  ${varName}: ${token.value};`);
    }
    lines.push("");
  }

  if (tokens.spacing.length > 0) {
    lines.push("  /* === SPACING === */");
    for (const token of tokens.spacing) {
      const varName = token.cssVariable || `--space-${token.name.toLowerCase().replace(/[/\s]+/g, "-")}`;
      lines.push(`  ${varName}: ${token.value};`);
    }
    lines.push("");
  }

  if (tokens.radius.length > 0) {
    lines.push("  /* === BORDER RADIUS === */");
    for (const token of tokens.radius) {
      const varName = token.cssVariable || `--radius-${token.name.toLowerCase().replace(/[/\s]+/g, "-")}`;
      lines.push(`  ${varName}: ${token.value};`);
    }
    lines.push("");
  }

  if (tokens.effects.length > 0) {
    lines.push("  /* === EFFECTS === */");
    for (const token of tokens.effects) {
      const varName = token.cssVariable || `--effect-${token.name.toLowerCase().replace(/[/\s]+/g, "-")}`;
      lines.push(`  ${varName}: ${token.value};`);
    }
    lines.push("");
  }

  lines.push("}");
  return lines.join("\n");
}

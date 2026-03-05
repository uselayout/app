import type { ExtractedTokens } from "@/lib/types";

export function generateTailwindConfig(tokens: ExtractedTokens): string {
  const colors: Record<string, string> = {};
  const spacing: Record<string, string> = {};
  const borderRadius: Record<string, string> = {};

  for (const token of tokens.colors) {
    const key = token.name
      .toLowerCase()
      .replace(/[/\s]+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const varName = token.cssVariable || `--color-${key}`;
    colors[key] = `var(${varName})`;
  }

  for (const token of tokens.spacing) {
    const key = token.name
      .toLowerCase()
      .replace(/[/\s]+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const varName = token.cssVariable || `--space-${key}`;
    spacing[key] = `var(${varName})`;
  }

  for (const token of tokens.radius) {
    const key = token.name
      .toLowerCase()
      .replace(/[/\s]+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const varName = token.cssVariable || `--radius-${key}`;
    borderRadius[key] = `var(${varName})`;
  }

  const config = {
    theme: {
      extend: {
        ...(Object.keys(colors).length > 0 ? { colors } : {}),
        ...(Object.keys(spacing).length > 0 ? { spacing } : {}),
        ...(Object.keys(borderRadius).length > 0 ? { borderRadius } : {}),
      },
    },
  };

  return `/** @type {import('tailwindcss').Config} */
module.exports = ${JSON.stringify(config, null, 2)};
`;
}

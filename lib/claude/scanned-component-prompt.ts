import type { ScannedComponent } from "@/lib/types";

/**
 * Format a scanned component for an AI prompt. Includes Storybook stories and
 * args when available so agents know what variants already exist and what the
 * accepted prop values look like. Keeps the format tight — one line per piece.
 */
export function formatScannedComponentForPrompt(c: ScannedComponent): string {
  const lines: string[] = [];
  const importPath = c.importPath.startsWith("src/")
    ? "@/" + c.importPath.slice(4)
    : c.importPath;
  const propsStr = c.props.length > 0 ? ` props: ${c.props.join(", ")}` : "";
  lines.push(`- ${c.name} (import from '${importPath}')${propsStr}`);

  if (c.stories && c.stories.length > 0) {
    lines.push(`  existing stories: ${c.stories.join(", ")}`);
  }

  if (c.args && c.args.length > 0) {
    const argLines = c.args
      .filter((a) => a.options && a.options.length > 0)
      .slice(0, 6)
      .map((a) => `  ${a.name}: ${a.options!.map((o) => `"${o}"`).join(" | ")}`);
    lines.push(...argLines);
  }

  return lines.join("\n");
}

/**
 * Compact Storybook metadata for inclusion in MCP list_components output —
 * stories and arg options only. Names and paths are carried by the caller.
 */
export function summariseStorybookMetadata(c: ScannedComponent): {
  stories?: string[];
  argOptions?: Record<string, string[]>;
} {
  const out: { stories?: string[]; argOptions?: Record<string, string[]> } = {};
  if (c.stories && c.stories.length > 0) out.stories = c.stories;
  if (c.args && c.args.length > 0) {
    const options: Record<string, string[]> = {};
    for (const a of c.args) {
      if (a.options && a.options.length > 0) options[a.name] = a.options;
    }
    if (Object.keys(options).length > 0) out.argOptions = options;
  }
  return out;
}

// ─── Icon Section Generator for layout.md ───────────────────────────────────
// Generates a "## 10. Icons" section based on selected icon packs.

import { getIconPacks, type IconPack } from "./registry";

const MARKER_START = "<!-- layout:icons:start -->";
const MARKER_END = "<!-- layout:icons:end -->";

function generatePackBlock(pack: IconPack): string {
  const common = pack.commonIcons.slice(0, 20).join(", ");

  if (pack.id === "simple-icons") {
    return `**${pack.name}** (${pack.iconCount}+ brand logos, ${pack.license}):
\`\`\`html
${pack.importSyntax}
\`\`\`
Naming: ${pack.namingConvention}
Common: ${common}`;
  }

  return `**${pack.name}** (${pack.iconCount}+ icons, ${pack.license}):
\`\`\`tsx
${pack.importSyntax}
\`\`\`
Naming: ${pack.namingConvention}
Common: ${common}`;
}

export function generateIconSection(iconPackIds: string[]): string {
  const packs = getIconPacks(iconPackIds);
  if (packs.length === 0) return "";

  const uiPacks = packs.filter((p) => p.id !== "simple-icons");
  const brandPack = packs.find((p) => p.id === "simple-icons");

  const packNames = packs.map((p) => `**${p.name}**`).join(" and ");
  const packBlocks = packs.map(generatePackBlock).join("\n\n");

  const usageRules = uiPacks.length > 0
    ? `
**Usage rules:**
- Import icons as named React components from the library
- Default size: 24px, use the \`size\` prop to adjust
- Icons inherit \`currentColor\` for stroke/fill colour
- NEVER use inline SVG paths when the icon library provides the icon
- NEVER use emoji or Unicode symbols as icon substitutes${brandPack ? "\n- Use Simple Icons CDN for brand/company logos, not the UI icon library" : ""}`
    : `
**Usage rules:**
- Use Simple Icons CDN for brand/company logos
- Apply opacity-40 to opacity-70 for subtle logo bars
- Only use for brands you are certain exist in Simple Icons`;

  return `${MARKER_START}

## 10. Icons

### Icon Libraries
This design system uses ${packNames} icons.

${packBlocks}
${usageRules}

${MARKER_END}`;
}

/**
 * Inject or replace the icons section in a layout.md string.
 * If markers exist, replaces between them. Otherwise appends before appendix or at end.
 */
export function injectIconSection(layoutMd: string, iconPackIds: string[]): string {
  const section = generateIconSection(iconPackIds);

  // Remove existing section if present
  const startIdx = layoutMd.indexOf(MARKER_START);
  const endIdx = layoutMd.indexOf(MARKER_END);

  if (startIdx !== -1 && endIdx !== -1) {
    const before = layoutMd.slice(0, startIdx).trimEnd();
    const after = layoutMd.slice(endIdx + MARKER_END.length).trimStart();

    if (!section) return `${before}\n\n${after}`;
    return `${before}\n\n${section}\n\n${after}`;
  }

  // No existing section: append
  if (!section) return layoutMd;

  // Try to insert before appendix sections
  const appendixMatch = layoutMd.match(/\n(## Appendix|## A\.|---\s*\n\s*\*Source)/);
  if (appendixMatch?.index != null) {
    const before = layoutMd.slice(0, appendixMatch.index).trimEnd();
    const after = layoutMd.slice(appendixMatch.index);
    return `${before}\n\n${section}\n\n${after}`;
  }

  // Fallback: append at end
  return `${layoutMd.trimEnd()}\n\n${section}`;
}

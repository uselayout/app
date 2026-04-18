import type { BrandingAsset } from "@/lib/types";

const SECTION_HEADING = "## Branding Assets";
const SECTION_RE =
  /\n## Branding Assets[\s\S]*?(?=\n## |\n# |$)/;

function formatSection(assets: BrandingAsset[]): string {
  if (assets.length === 0) return "";

  const rows = assets
    .map(
      (a) =>
        `| \`${a.slot}\` | ${a.name} | ${a.mimeType} | \`data-brand-logo="${a.slot}"\` |`
    )
    .join("\n");

  return `\n${SECTION_HEADING}\n\nUploaded brand assets resolved at runtime via the \`data-brand-logo\` attribute. Reference these slots in generated code — never hardcode logo URLs, and never use \`data-generate-image\` for the project's own brand logo.\n\n| Slot | File | Type | Usage |\n|------|------|------|-------|\n${rows}\n`;
}

/**
 * Insert, replace, or remove the `## Branding Assets` section in a
 * layout.md document to reflect the current set of uploaded assets.
 *
 * Idempotent — safe to call on every asset change.
 */
export function syncBrandingSectionToLayoutMd(
  layoutMd: string,
  assets: BrandingAsset[]
): string {
  const section = formatSection(assets);

  // Already present — replace in place (up to the next top-level heading).
  if (SECTION_RE.test(layoutMd)) {
    if (section === "") {
      return layoutMd.replace(SECTION_RE, "\n");
    }
    return layoutMd.replace(SECTION_RE, section);
  }

  if (section === "") return layoutMd;

  // Append at the end of the document. A leading newline is already baked in.
  const trimmed = layoutMd.replace(/\n+$/, "");
  return `${trimmed}\n${section}`;
}

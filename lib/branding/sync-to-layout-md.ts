import type { BrandingAsset } from "@/lib/types";

const SECTION_HEADING = "## Branding Assets";
const SECTION_RE =
  /\n## Branding Assets[\s\S]*?(?=\n## |\n# |$)/;

function formatSection(assets: BrandingAsset[]): string {
  if (assets.length === 0) return "";

  const rows = assets
    .map((a) => {
      const variant = a.variant ?? "colour";
      const usage =
        variant === "colour"
          ? `\`data-brand-logo="${a.slot}"\``
          : `\`data-brand-logo="${a.slot}" data-brand-variant="${variant}"\``;
      return `| \`${a.slot}\` | \`${variant}\` | ${a.name} | ${a.mimeType} | ${usage} |`;
    })
    .join("\n");

  return `\n${SECTION_HEADING}\n\nUploaded brand assets resolved at runtime via the \`data-brand-logo\` attribute. Reference these slots in generated code — never hardcode logo URLs, and never use \`data-generate-image\` for the project's own brand logo.\n\nVariants express the same logo tuned for a different surface: use \`colour\` on light backgrounds, \`white\` on dark surfaces, \`black\` for mono prints, \`mono\` for single-colour outlines. The runtime falls back to the \`colour\` variant of the same slot when a requested variant isn't uploaded.\n\n| Slot | Variant | File | Type | Usage |\n|------|---------|------|------|-------|\n${rows}\n`;
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

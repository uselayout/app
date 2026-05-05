/**
 * Auto-sync the "5. Components" section of a project's layout.md based on the
 * project's linked saved components. Called after a successful component save
 * so Cursor exports always reflect the latest canonical TSX without requiring
 * the user to re-export.
 */

import type { Component } from "@/lib/types/component";
import type { ExtractedComponent } from "@/lib/types";

interface SyncInput {
  /** Current layout.md (may be empty for fresh projects). */
  layoutMd: string;
  /** Imported components from extractionData. */
  importedComponents: ExtractedComponent[];
  /** Saved Components linked to imported component names. */
  linkedComponents: Component[];
}

const SECTION_HEADER = "## 5. Components";

/** Splice or append a regenerated Components section into layout.md. */
export function syncComponentsSection({
  layoutMd,
  importedComponents,
  linkedComponents,
}: SyncInput): string {
  const linkedByName = new Map<string, Component>();
  for (const c of linkedComponents) {
    if (c.linkedComponentName) linkedByName.set(c.linkedComponentName, c);
  }

  const renderedSection = renderSection(importedComponents, linkedByName);

  const sectionStart = findSectionStart(layoutMd);
  if (sectionStart === -1) {
    return layoutMd.trim() + "\n\n" + renderedSection + "\n";
  }
  const sectionEnd = findNextH2(layoutMd, sectionStart);
  if (sectionEnd === -1) {
    return layoutMd.slice(0, sectionStart) + renderedSection + "\n";
  }
  return (
    layoutMd.slice(0, sectionStart) +
    renderedSection +
    "\n\n" +
    layoutMd.slice(sectionEnd)
  );
}

function findSectionStart(md: string): number {
  const found = md.match(/^##\s+5\.\s+Components\s*$/m);
  return found?.index ?? -1;
}

/** Find the next "## " heading after `from`. Returns -1 if none. */
function findNextH2(md: string, from: number): number {
  const tail = md.slice(from + 1);
  const found = tail.match(/^##\s+/m);
  return found?.index !== undefined ? found.index + from + 1 : -1;
}

function renderSection(
  imported: ExtractedComponent[],
  linkedByName: Map<string, Component>
): string {
  const filtered = imported.filter(
    (c) =>
      !c.name.toLowerCase().startsWith("icon/") &&
      !c.name.toLowerCase().startsWith("icon\\")
  );

  if (filtered.length === 0) {
    return SECTION_HEADER + "\n\n_No components imported yet._";
  }

  const blocks = filtered.map((c) =>
    renderComponentBlock(c, linkedByName.get(c.name) ?? null)
  );
  return SECTION_HEADER + "\n\n" + blocks.join("\n\n");
}

function renderComponentBlock(
  imported: ExtractedComponent,
  linked: Component | null
): string {
  const lines: string[] = [`### ${imported.name}`];

  if (imported.description) {
    lines.push("", imported.description.trim());
  }

  if (
    imported.variantGroupProperties &&
    Object.keys(imported.variantGroupProperties).length > 0
  ) {
    lines.push("", "**Variant axes:**");
    for (const [axis, values] of Object.entries(imported.variantGroupProperties)) {
      lines.push(`- \`${axis}\`: ${values.map((v) => `\`${v}\``).join(", ")}`);
    }
  } else if (imported.variantCount > 1) {
    lines.push("", `${imported.variantCount} variants`);
  }

  if (linked && linked.code) {
    lines.push("", "**Canonical example (TSX):**", "", "```tsx", linked.code.trim(), "```");
  } else {
    lines.push(
      "",
      "_No canonical TSX yet — click this component in the Studio inspector and choose Generate code._"
    );
  }

  return lines.join("\n");
}

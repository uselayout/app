import type { Project, ProjectStandardisation } from "@/lib/types";
import { CORE_TOKENS_BLOCK_REGEX } from "@/lib/tokens/core-tokens-block";

// The derive engine composes the canonical layout.md on every read from live
// project state. Callers that previously read `project.layoutMd` directly
// (MCP, Explorer, export) should read through `deriveLayoutMd(project)` so
// the CORE TOKENS block, Appendix A, Icons block, Brand Assets and Product
// Context sections always reflect the current curated assignments, extracted
// tokens, scanned components, selected icon packs, uploaded branding and
// context documents.
//
// Authored prose (Design Direction, Component Patterns narrative, Anti-pattern
// stories) is preserved from `project.layoutMd` untouched. Only blocks listed
// below are regenerated. This lets users continue hand-editing layout.md
// through Monaco while eliminating the silent regex-miss bug class that
// plagued the previous write-then-read model.

export interface DeriveOptions {
  // If true, skip the CORE TOKENS regeneration. Used by callers that want to
  // render authored prose only (e.g. for a diff view).
  skipCoreTokens?: boolean;
}

export function deriveLayoutMd(project: Project, options: DeriveOptions = {}): string {
  let md = project.layoutMd ?? "";

  if (!options.skipCoreTokens && project.standardisation) {
    md = injectCoreTokensBlock(md, project.standardisation);
  }

  // Phase 1b will add:
  //   md = injectAppendixA(md, project.extractionData);
  //   md = injectIconsBlock(md, project.iconPacks);
  //   md = injectBrandAssetsSection(md, project.brandingAssets);
  //   md = injectProductContextSection(md, project.contextDocuments);

  return md;
}

export function renderCoreTokensBlock(standardisation: ProjectStandardisation): string {
  const assignments = Object.values(standardisation.assignments);
  if (assignments.length === 0) return "";

  const lines: string[] = ["/* ── CORE TOKENS ── */", ""];
  const colourRoleKeys = ["bg-", "text-", "border", "accent", "success", "warning", "error", "info"];
  const isColour = (roleKey: string) =>
    colourRoleKeys.some((k) => roleKey.startsWith(k) || roleKey.includes(k));

  const colours = assignments.filter((a) => isColour(a.roleKey));
  const other = assignments.filter((a) => !isColour(a.roleKey));

  if (colours.length > 0) {
    lines.push("/* Colours */");
    for (const a of colours) {
      lines.push(`${a.standardName}: ${a.value};`);
    }
  }
  if (other.length > 0) {
    lines.push("", "/* Other */");
    for (const a of other) {
      lines.push(`${a.standardName}: ${a.value};`);
    }
  }

  return "```css\n" + lines.join("\n") + "\n```";
}

function injectCoreTokensBlock(md: string, standardisation: ProjectStandardisation): string {
  const rendered = renderCoreTokensBlock(standardisation);
  if (!rendered) return md;

  // Only replace an existing block. Creating a new §0 Quick Reference from
  // scratch is out of scope for Phase 1 — it requires narrative content
  // Claude produces. For projects whose synthesis never wrote a block the
  // curated tokens simply don't appear in the derived output; fixing this
  // is handled by the Phase 2 hub UI which will run synthesis if needed.
  if (CORE_TOKENS_BLOCK_REGEX.test(md)) {
    return md.replace(CORE_TOKENS_BLOCK_REGEX, rendered);
  }
  return md;
}

import type { ExtractedToken, ExtractedTokens, Project, ProjectStandardisation } from "@/lib/types";
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
  // If true, skip the Appendix A regeneration. Used when the caller already
  // has its own token reference (e.g. MCP tools that return tokens separately).
  skipAppendixA?: boolean;
}

// Minimum input shape the derive engine needs. Letting callers pass a partial
// avoids forcing a full Project fetch (with explorations, snapshots, etc.)
// every time someone reads layout.md via MCP or the Explorer.
export type DeriveInput = Pick<Project, "layoutMd" | "standardisation" | "extractionData">;

export function deriveLayoutMd(input: DeriveInput, options: DeriveOptions = {}): string {
  let md = input.layoutMd ?? "";

  if (!options.skipCoreTokens && input.standardisation) {
    md = injectCoreTokensBlock(md, input.standardisation);
  }

  if (!options.skipAppendixA && input.extractionData?.tokens) {
    md = injectAppendixA(md, input.extractionData.tokens);
  }

  // Phase 3 will add:
  //   md = injectIconsBlock(md, input.iconPacks);
  //   md = injectBrandAssetsSection(md, input.brandingAssets);
  //   md = injectProductContextSection(md, input.contextDocuments);

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

// Match "## Appendix A..." through the next "## " heading or end of document.
// Multi-line flag required so `^## ` anchors at each line's start.
const APPENDIX_A_SECTION_REGEX = /^## Appendix A[^\n]*\n[\s\S]*?(?=^## |$(?![\s\S]))/m;

export function renderAppendixA(tokens: ExtractedTokens): string {
  const lines: string[] = [];
  const emitCategory = (label: string, toks: ExtractedToken[]) => {
    if (toks.length === 0) return;
    if (lines.length > 0) lines.push("");
    lines.push(`/* ${label} (${toks.length}) */`);
    for (const t of toks) {
      const cssVar = t.cssVariable ?? `--${t.name}`;
      const trailing = [
        t.description ? t.description : null,
        t.mode ? `mode: ${t.mode}` : null,
      ].filter((s): s is string => Boolean(s));
      const comment = trailing.length > 0 ? ` /* ${trailing.join(" — ")} */` : "";
      lines.push(`${cssVar}: ${t.value};${comment}`);
    }
  };

  emitCategory("Colours", tokens.colors);
  emitCategory("Typography", tokens.typography);
  emitCategory("Spacing", tokens.spacing);
  emitCategory("Radius", tokens.radius);
  emitCategory("Effects", tokens.effects);
  emitCategory("Motion", tokens.motion ?? []);

  if (lines.length === 0) return "";

  return [
    "## Appendix A: Complete Token Reference",
    "",
    "Every token extracted from the source. §0 CORE TOKENS is the primary AI signal; this appendix is reference material an AI can cross-check against when a curated role is missing.",
    "",
    "```css",
    lines.join("\n"),
    "```",
  ].join("\n");
}

function injectAppendixA(md: string, tokens: ExtractedTokens): string {
  const rendered = renderAppendixA(tokens);
  if (!rendered) return md;

  // Replace in place if the section exists.
  if (APPENDIX_A_SECTION_REGEX.test(md)) {
    return md.replace(APPENDIX_A_SECTION_REGEX, rendered + "\n\n");
  }

  // Insert before Appendix B if present — keeps the B/C/D… alphabetic order.
  const appendixBIndex = md.search(/^## Appendix B\b/m);
  if (appendixBIndex !== -1) {
    return md.slice(0, appendixBIndex) + rendered + "\n\n" + md.slice(appendixBIndex);
  }

  // Otherwise append at end of document, trimming excessive trailing whitespace.
  // Use "\n\n" as trailing so a follow-up derive replacing this section via
  // APPENDIX_A_SECTION_REGEX (which consumes through EOF) produces the same
  // string — i.e. the function is idempotent.
  const trimmed = md.replace(/\s*$/, "");
  const separator = trimmed.length > 0 ? "\n\n" : "";
  return trimmed + separator + rendered + "\n\n";
}

// Split an existing hand-edited layoutMd into authored prose and discarded
// derived-block content. Used by the one-shot migration that introduces
// `project.layoutMdAuthored` as the canonical store of non-derived text.
//
// "Authored" is everything the derive engine does NOT regenerate on each
// read: design direction, section narrative, anti-pattern stories, custom
// sections. "Derived" sections — CORE TOKENS block, Appendix A (raw token
// reference), ## Brand Assets, ## Icons, ## Component Inventory,
// ## Product Context — are dropped because the engine regenerates them
// from live project state every time layout.md is read.

import { CORE_TOKENS_BLOCK_REGEX } from "@/lib/tokens/core-tokens-block";

// Top-level headings the derive engine owns. Anything under these is
// regenerated on read so we don't need to preserve it in authored prose.
const DERIVED_HEADINGS = [
  "Appendix A",
  "Brand Assets",
  "Icons",
  "Component Inventory",
  "Product Context",
];

export function splitLayoutMdIntoAuthored(layoutMd: string): string {
  if (!layoutMd) return "";

  let result = layoutMd;

  // 1. Strip the CORE TOKENS fenced CSS block. The derive engine regenerates
  //    this from standardisation.assignments on every read, so keeping a
  //    stale copy in authored prose just creates drift.
  result = result.replace(CORE_TOKENS_BLOCK_REGEX, "");

  // 2. Strip each derived top-level section through to the next `## ` heading
  //    or end of document.
  for (const heading of DERIVED_HEADINGS) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const sectionRegex = new RegExp(
      `^## ${escaped}[^\\n]*\\n[\\s\\S]*?(?=^## |$(?![\\s\\S]))`,
      "gm"
    );
    result = result.replace(sectionRegex, "");
  }

  // 3. Collapse runs of 3+ blank lines (from stripped sections) to 2.
  result = result.replace(/\n{3,}/g, "\n\n");

  // Normalise trailing whitespace to exactly one newline so repeat calls are
  // idempotent (trimEnd + "\n" is fixed-point under re-application).
  return result.trimEnd() + "\n";
}

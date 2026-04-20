// Compute 1-indexed line ranges in a layout.md document that belong to
// derive-engine-owned content. Monaco uses these to lock the ranges via
// decorations + an edit guard; the Design System page could use them to
// surface "edit in Tokens / Components / Assets" affordances later.
//
// The ranges mirror what `lib/layout-md/derive.ts` regenerates on read:
//   - CORE TOKENS fenced CSS block (lives inside §0 Quick Reference)
//   - ## Appendix A: Complete Token Reference
//   - ## Brand Assets
//   - ## Icons
//   - ## Component Inventory
//   - ## Product Context
//
// Anything else is authored prose the derive engine leaves alone.

export type DerivedRangeKind =
  | "core-tokens"
  | "appendix-a"
  | "brand-assets"
  | "icons"
  | "component-inventory"
  | "product-context";

export interface DerivedRange {
  kind: DerivedRangeKind;
  /** Human-readable label for the lock chip / gutter tooltip. */
  label: string;
  /** Which hub sub-tab the user should edit instead (Phase 2 deep-linking). */
  editIn: "tokens" | "components" | "assets" | "context";
  /** 1-indexed, inclusive. Matches Monaco's line numbering. */
  startLine: number;
  /** 1-indexed, inclusive. */
  endLine: number;
}

const DERIVED_HEADINGS: Array<{
  heading: string;
  kind: DerivedRangeKind;
  label: string;
  editIn: DerivedRange["editIn"];
}> = [
  { heading: "Appendix A", kind: "appendix-a", label: "Appendix A: Complete Token Reference", editIn: "tokens" },
  { heading: "Brand Assets", kind: "brand-assets", label: "Brand Assets", editIn: "assets" },
  { heading: "Icons", kind: "icons", label: "Icons", editIn: "assets" },
  { heading: "Component Inventory", kind: "component-inventory", label: "Component Inventory", editIn: "components" },
  { heading: "Product Context", kind: "product-context", label: "Product Context", editIn: "context" },
];

export function findDerivedRanges(markdown: string): DerivedRange[] {
  const lines = markdown.split("\n");
  const ranges: DerivedRange[] = [];

  // CORE TOKENS fenced CSS block — scan for a ```css fence whose next line is
  // a /* ... CORE TOKENS ... */ comment, through to the closing ``` fence.
  for (let i = 0; i < lines.length; i++) {
    if (!/^```css\s*$/.test(lines[i])) continue;
    const next = lines[i + 1] ?? "";
    if (!/\/\*\s*[─=\-]*\s*CORE TOKENS/.test(next)) continue;
    const start = i;
    let end = i + 1;
    for (let j = i + 1; j < lines.length; j++) {
      if (/^```\s*$/.test(lines[j])) {
        end = j;
        break;
      }
    }
    ranges.push({
      kind: "core-tokens",
      label: "CORE TOKENS (derived from Curated assignments)",
      editIn: "tokens",
      startLine: start + 1,
      endLine: end + 1,
    });
    break; // only the first such block
  }

  // Top-level derived sections — from `## Heading` to the line before the
  // next `## ` heading or EOF.
  const sectionStarts: Array<{ idx: number; spec: (typeof DERIVED_HEADINGS)[number] }> = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("## ")) continue;
    for (const spec of DERIVED_HEADINGS) {
      const pattern = new RegExp(`^## ${spec.heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (pattern.test(line)) {
        sectionStarts.push({ idx: i, spec });
        break;
      }
    }
  }

  for (const { idx, spec } of sectionStarts) {
    // Find next top-level heading after this one
    let end = lines.length - 1;
    for (let j = idx + 1; j < lines.length; j++) {
      if (lines[j].startsWith("## ")) {
        end = j - 1;
        break;
      }
    }
    ranges.push({
      kind: spec.kind,
      label: spec.label,
      editIn: spec.editIn,
      startLine: idx + 1,
      endLine: end + 1,
    });
  }

  // Sort by start line so downstream consumers can iterate in document order.
  ranges.sort((a, b) => a.startLine - b.startLine);
  return ranges;
}

/**
 * Return true when the given 1-indexed line range overlaps any derived range.
 * Monaco's content-change events report edits in model ranges that the guard
 * checks against this helper to decide whether to revert.
 */
export function rangeOverlapsDerived(
  editStartLine: number,
  editEndLine: number,
  derivedRanges: DerivedRange[]
): DerivedRange | null {
  for (const r of derivedRanges) {
    if (editStartLine <= r.endLine && editEndLine >= r.startLine) return r;
  }
  return null;
}

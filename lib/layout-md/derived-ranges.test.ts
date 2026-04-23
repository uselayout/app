import { describe, expect, it } from "vitest";
import { findDerivedRanges, rangeOverlapsDerived } from "./derived-ranges";

describe("findDerivedRanges", () => {
  it("returns an empty list for authored-only prose", () => {
    const md = `# layout.md

## 1. Design Direction

prose
`;
    expect(findDerivedRanges(md)).toEqual([]);
  });

  it("locates the CORE TOKENS fenced block regardless of delimiter", () => {
    for (const decorated of [
      "/* === CORE TOKENS === */",
      "/* ── CORE TOKENS ── */",
      "/* -- CORE TOKENS -- */",
      "/* CORE TOKENS */",
    ]) {
      const md = ["# layout", "", "## 0. Quick Reference", "", "```css", decorated, "--x: red;", "```", "", "## 1. Design"].join("\n");
      const ranges = findDerivedRanges(md);
      const core = ranges.find((r) => r.kind === "core-tokens");
      expect(core, `expected core-tokens range for: ${decorated}`).toBeDefined();
      // Lines 5 through 8 — the fence, comment, declaration, closing fence.
      expect(core!.startLine).toBe(5);
      expect(core!.endLine).toBe(8);
    }
  });

  it("finds all five derived sections with correct 1-indexed bounds", () => {
    const md = `# layout

## 1. Design

prose

## Brand Assets

logo stuff

## Icons

icons stuff

## Component Inventory

components stuff

## Product Context

context stuff

## Appendix A: Complete Token Reference

tokens

## Appendix B: Token Source Metadata

authored meta
`;
    const ranges = findDerivedRanges(md);
    const kinds = ranges.map((r) => r.kind);
    expect(kinds).toEqual([
      "brand-assets",
      "icons",
      "component-inventory",
      "product-context",
      "appendix-a",
    ]);
    // Each range should span from its heading line through to the line
    // before the next ## heading (Appendix B for the last one).
    const brandAssets = ranges.find((r) => r.kind === "brand-assets")!;
    expect(brandAssets.startLine).toBe(md.split("\n").findIndex((l) => l === "## Brand Assets") + 1);
    // Appendix A ends at the line before "## Appendix B".
    const appendixA = ranges.find((r) => r.kind === "appendix-a")!;
    const appendixBIdx = md.split("\n").findIndex((l) => l === "## Appendix B: Token Source Metadata");
    expect(appendixA.endLine).toBe(appendixBIdx);
  });

  it("tags each range with the hub sub-tab the user should edit in instead", () => {
    const md = `# layout

## Brand Assets

## Icons

## Component Inventory

## Product Context

## Appendix A

tokens
`;
    const ranges = findDerivedRanges(md);
    const byKind = Object.fromEntries(ranges.map((r) => [r.kind, r.editIn]));
    expect(byKind["brand-assets"]).toBe("assets");
    expect(byKind["icons"]).toBe("assets");
    expect(byKind["component-inventory"]).toBe("components");
    expect(byKind["product-context"]).toBe("context");
    expect(byKind["appendix-a"]).toBe("tokens");
  });

  it("ignores CORE TOKENS inside an inline code span (only matches fenced blocks)", () => {
    const md = "# title\n\nThis references `CORE TOKENS` in prose but is not a block.\n";
    expect(findDerivedRanges(md)).toEqual([]);
  });
});

describe("rangeOverlapsDerived", () => {
  const ranges = [
    { kind: "core-tokens" as const, label: "x", editIn: "tokens" as const, startLine: 5, endLine: 8 },
    { kind: "appendix-a" as const, label: "y", editIn: "tokens" as const, startLine: 20, endLine: 30 },
  ];

  it("detects an edit fully inside a derived range", () => {
    expect(rangeOverlapsDerived(6, 7, ranges)?.kind).toBe("core-tokens");
  });

  it("detects an edit that straddles the boundary of a derived range", () => {
    expect(rangeOverlapsDerived(4, 6, ranges)?.kind).toBe("core-tokens");
    expect(rangeOverlapsDerived(30, 35, ranges)?.kind).toBe("appendix-a");
  });

  it("returns null for an edit entirely outside every derived range", () => {
    expect(rangeOverlapsDerived(1, 4, ranges)).toBeNull();
    expect(rangeOverlapsDerived(9, 19, ranges)).toBeNull();
    expect(rangeOverlapsDerived(31, 40, ranges)).toBeNull();
  });
});

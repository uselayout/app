import { describe, expect, it } from "vitest";
import { splitLayoutMdIntoAuthored } from "./split-authored";

describe("splitLayoutMdIntoAuthored", () => {
  it("returns empty string for empty input", () => {
    expect(splitLayoutMdIntoAuthored("")).toBe("");
  });

  it("strips the CORE TOKENS fenced CSS block regardless of delimiter format", () => {
    for (const decorated of [
      "/* === CORE TOKENS === */",
      "/* ── CORE TOKENS ── */",
      "/* -- CORE TOKENS -- */",
      "/* CORE TOKENS */",
    ]) {
      const md = `## 0. Quick Reference\n\n\`\`\`css\n${decorated}\n--x: red;\n\`\`\`\n\n## 1. Design Direction\n\nprose here\n`;
      const authored = splitLayoutMdIntoAuthored(md);
      expect(authored).not.toContain("CORE TOKENS");
      expect(authored).not.toContain("--x: red;");
      expect(authored).toContain("## 1. Design Direction");
      expect(authored).toContain("prose here");
    }
  });

  it("strips known derived sections (Appendix A, Brand Assets, Icons, Component Inventory, Product Context)", () => {
    const md = `# layout.md

## 1. Design Direction

keep this prose

## Appendix A: Complete Token Reference

drop this appendix

\`\`\`css
--x: red;
\`\`\`

## Brand Assets

drop this

## Icons

drop this

## Component Inventory

drop this

## Product Context

drop this

## Appendix B: Token Source Metadata

keep this authored appendix
`;
    const authored = splitLayoutMdIntoAuthored(md);
    expect(authored).toContain("## 1. Design Direction");
    expect(authored).toContain("keep this prose");
    expect(authored).toContain("## Appendix B");
    expect(authored).toContain("keep this authored appendix");
    for (const dropped of [
      "Appendix A",
      "Brand Assets",
      "Icons",
      "Component Inventory",
      "Product Context",
      "drop this",
      "--x: red;",
    ]) {
      expect(authored, `expected "${dropped}" to be stripped`).not.toContain(dropped);
    }
  });

  it("preserves authored prose exactly when nothing derived is present", () => {
    const md = "## 1. Design\n\nmy prose\n\n## 2. Colour System\n\nmore prose\n";
    expect(splitLayoutMdIntoAuthored(md)).toContain("my prose");
    expect(splitLayoutMdIntoAuthored(md)).toContain("more prose");
  });

  it("is idempotent — splitting an already-authored doc returns the same string", () => {
    const md = "## 1. Design\n\nprose\n";
    const once = splitLayoutMdIntoAuthored(md);
    const twice = splitLayoutMdIntoAuthored(once);
    expect(twice).toBe(once);
  });

  it("collapses leftover triple blank lines from stripped sections", () => {
    const md = `## 1. A\n\n\n\n## Appendix A\n\nstripped\n\n\n\n## 2. B\n\nkeep\n`;
    const out = splitLayoutMdIntoAuthored(md);
    expect(out).not.toMatch(/\n{3,}/);
    expect(out).toContain("## 1. A");
    expect(out).toContain("## 2. B");
  });
});

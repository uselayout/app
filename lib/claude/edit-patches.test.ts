import { describe, it, expect } from "vitest";
import { parsePatches, applyPatches } from "./edit-patches";

describe("parsePatches", () => {
  it("parses a single block", () => {
    const input = [
      "<<<<<<< SEARCH",
      "old line",
      "=======",
      "new line",
      ">>>>>>> REPLACE",
    ].join("\n");
    const patches = parsePatches(input);
    expect(patches).toEqual([{ search: "old line", replace: "new line" }]);
  });

  it("parses multiple blocks", () => {
    const input = `
Some reasoning from the model.

<<<<<<< SEARCH
first old
=======
first new
>>>>>>> REPLACE

<<<<<<< SEARCH
second old
=======
second new
>>>>>>> REPLACE
`;
    const patches = parsePatches(input);
    expect(patches).toHaveLength(2);
    expect(patches[0]).toEqual({ search: "first old", replace: "first new" });
    expect(patches[1]).toEqual({ search: "second old", replace: "second new" });
  });

  it("preserves multi-line content inside blocks", () => {
    const input = [
      "<<<<<<< SEARCH",
      "## Section",
      "",
      "paragraph",
      "=======",
      "## Renamed Section",
      "",
      "paragraph with change",
      ">>>>>>> REPLACE",
    ].join("\n");
    const [patch] = parsePatches(input);
    expect(patch.search).toBe("## Section\n\nparagraph");
    expect(patch.replace).toBe("## Renamed Section\n\nparagraph with change");
  });

  it("returns empty array when no blocks are present", () => {
    expect(parsePatches("just prose, no blocks")).toEqual([]);
  });

  it("tolerates CRLF line endings", () => {
    const input = [
      "<<<<<<< SEARCH",
      "old",
      "=======",
      "new",
      ">>>>>>> REPLACE",
    ].join("\r\n");
    const patches = parsePatches(input);
    expect(patches).toEqual([{ search: "old", replace: "new" }]);
  });

  it("supports empty REPLACE (deletion)", () => {
    const input = [
      "<<<<<<< SEARCH",
      "to delete",
      "=======",
      "",
      ">>>>>>> REPLACE",
    ].join("\n");
    const patches = parsePatches(input);
    expect(patches).toEqual([{ search: "to delete", replace: "" }]);
  });
});

describe("applyPatches", () => {
  const sample = `# Design System

## 1. Colours

\`\`\`css
--color-primary: #6750A4;
--color-secondary: #958DA5;
\`\`\`

## 2. Branding Assets

Use the colour logo on light backgrounds.
`;

  it("applies a single patch and returns the modified file", () => {
    const result = applyPatches(sample, [
      {
        search: "Use the colour logo on light backgrounds.",
        replace: "Use the black logo on light backgrounds.",
      },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.newLayoutMd).toContain("Use the black logo on light backgrounds.");
    expect(result.result.newLayoutMd).not.toContain("Use the colour logo on light backgrounds.");
    expect(result.result.applied).toBe(1);
  });

  it("applies multiple patches sequentially", () => {
    const result = applyPatches(sample, [
      { search: "--color-primary: #6750A4;", replace: "--color-primary: #0a4b19ff;" },
      { search: "--color-secondary: #958DA5;", replace: "--color-secondary: #222;" },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.newLayoutMd).toContain("--color-primary: #0a4b19ff;");
    expect(result.result.newLayoutMd).toContain("--color-secondary: #222;");
    expect(result.result.applied).toBe(2);
  });

  it("leaves untouched regions byte-identical", () => {
    const result = applyPatches(sample, [
      {
        search: "Use the colour logo on light backgrounds.",
        replace: "Use the black logo on light backgrounds.",
      },
    ]);
    if (!result.ok) throw new Error("expected ok");
    expect(result.result.newLayoutMd.slice(0, sample.indexOf("Use the colour"))).toBe(
      sample.slice(0, sample.indexOf("Use the colour"))
    );
  });

  it("returns NO_EDITS when given no patches", () => {
    const result = applyPatches(sample, []);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NO_EDITS");
  });

  it("returns SEARCH_NOT_FOUND when the search string is missing", () => {
    const result = applyPatches(sample, [
      { search: "this text does not appear", replace: "x" },
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("SEARCH_NOT_FOUND");
  });

  it("returns SEARCH_AMBIGUOUS when the search string matches more than once", () => {
    const twice = `alpha\nbeta\nalpha\n`;
    const result = applyPatches(twice, [{ search: "alpha", replace: "gamma" }]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("SEARCH_AMBIGUOUS");
  });

  it("is atomic: if a later patch fails, earlier patches are not persisted", () => {
    const result = applyPatches(sample, [
      { search: "--color-primary: #6750A4;", replace: "--color-primary: #000;" },
      { search: "does not exist", replace: "x" },
    ]);
    expect(result.ok).toBe(false);
    // Caller receives an error object, no partial newLayoutMd — they keep their original.
  });

  it("supports deletion via empty replace", () => {
    const result = applyPatches(sample, [
      { search: "Use the colour logo on light backgrounds.\n", replace: "" },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.newLayoutMd).not.toContain("Use the colour logo on light backgrounds.");
  });

  it("does not treat $ in the replacement as a regex back-reference", () => {
    const input = "price: OLD";
    const result = applyPatches(input, [
      { search: "OLD", replace: "$100 and $& literal" },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.newLayoutMd).toBe("price: $100 and $& literal");
  });
});

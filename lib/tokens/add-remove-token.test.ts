import { describe, expect, it } from "vitest";
import {
  addTokenToLayoutMd,
  appendTokensToSections,
  removeTokenFromLayoutMd,
} from "./add-remove-token";
import type { ExtractedToken } from "@/lib/types";

function token(partial: Partial<ExtractedToken> & Pick<ExtractedToken, "name" | "value" | "type">): ExtractedToken {
  return {
    category: "semantic",
    cssVariable: partial.cssVariable ?? `--${partial.name}`,
    ...partial,
  };
}

const WISE_STUB = `# layout.md

## 0. Quick Reference

\`\`\`css
/* ── CORE TOKENS ── */
--color-primary: #37517e;
\`\`\`

## 2. Colour System

\`\`\`css
--color-existing: #00a2dd;
\`\`\`

## 3. Typography System

\`\`\`css
--font-family-display: "Wise Sans";
\`\`\`

## 4. Spacing & Layout

\`\`\`css
--space-small: 16px;
\`\`\`

## 7. Elevation & Depth

\`\`\`css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.1);
\`\`\`

## 8. Motion

\`\`\`css
--duration-base: 150ms;
\`\`\`
`;

describe("appendTokensToSections", () => {
  it("returns markdown unchanged when tokens is empty", () => {
    expect(appendTokensToSections(WISE_STUB, [])).toBe(WISE_STUB);
  });

  it("places colour tokens in Section 2's CSS block, not CORE TOKENS", () => {
    const result = appendTokensToSections(WISE_STUB, [
      token({ name: "color-accent", value: "rgb(159,232,112)", type: "color" }),
    ]);
    // Section 2 gains the token
    const section2Index = result.indexOf("## 2. Colour System");
    const section3Index = result.indexOf("## 3. Typography System");
    const addedIndex = result.indexOf("--color-accent");
    expect(addedIndex).toBeGreaterThan(section2Index);
    expect(addedIndex).toBeLessThan(section3Index);
    // CORE TOKENS block is untouched
    const coreTokensBlock = result.match(/```css\s*\n\/\* ── CORE TOKENS ── \*\/[\s\S]*?\n```/)?.[0] ?? "";
    expect(coreTokensBlock).not.toContain("--color-accent");
  });

  it("routes typography to §3, spacing to §4, effect to §7, motion to §8", () => {
    const result = appendTokensToSections(WISE_STUB, [
      token({ name: "font-size-xl", value: "24px", type: "typography" }),
      token({ name: "space-md", value: "24px", type: "spacing" }),
      token({ name: "shadow-lg", value: "0 4px 8px rgba(0,0,0,0.2)", type: "effect" }),
      token({ name: "duration-slow", value: "350ms", type: "motion" }),
    ]);

    const idx = (s: string) => result.indexOf(s);
    expect(idx("--font-size-xl")).toBeGreaterThan(idx("## 3. Typography System"));
    expect(idx("--font-size-xl")).toBeLessThan(idx("## 4. Spacing & Layout"));
    expect(idx("--space-md")).toBeGreaterThan(idx("## 4. Spacing & Layout"));
    expect(idx("--space-md")).toBeLessThan(idx("## 7. Elevation & Depth"));
    expect(idx("--shadow-lg")).toBeGreaterThan(idx("## 7. Elevation & Depth"));
    expect(idx("--shadow-lg")).toBeLessThan(idx("## 8. Motion"));
    expect(idx("--duration-slow")).toBeGreaterThan(idx("## 8. Motion"));
  });

  it("routes radius tokens to §4 (shares with spacing)", () => {
    const result = appendTokensToSections(WISE_STUB, [
      token({ name: "radius-lg", value: "16px", type: "radius" }),
    ]);
    const idx = (s: string) => result.indexOf(s);
    expect(idx("--radius-lg")).toBeGreaterThan(idx("## 4. Spacing & Layout"));
    expect(idx("--radius-lg")).toBeLessThan(idx("## 7. Elevation & Depth"));
  });

  it("skips tokens already present in the target block (value-agnostic)", () => {
    const result = appendTokensToSections(WISE_STUB, [
      token({ name: "color-existing", value: "#DIFFERENT", type: "color" }),
    ]);
    expect(result).toBe(WISE_STUB);
  });

  it("deduplicates tokens within the same batch", () => {
    const result = appendTokensToSections(WISE_STUB, [
      token({ name: "color-accent", value: "#111", type: "color" }),
      token({ name: "color-accent", value: "#222", type: "color" }),
    ]);
    const occurrences = (result.match(/--color-accent:/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it("falls back to CORE TOKENS when a type's section is missing", () => {
    const stubNoSection2 = WISE_STUB.replace(/## 2\. Colour System[\s\S]*?## 3\./, "## 3.");
    const result = appendTokensToSections(stubNoSection2, [
      token({ name: "color-fallback", value: "#abc", type: "color" }),
    ]);
    const coreTokensBlock = result.match(/```css\s*\n\/\* ── CORE TOKENS ── \*\/[\s\S]*?\n```/)?.[0] ?? "";
    expect(coreTokensBlock).toContain("--color-fallback: #abc;");
  });

  it("matches 'Color' (US spelling) as well as 'Colour'", () => {
    const stubUS = WISE_STUB.replace("## 2. Colour System", "## 2. Color System");
    const result = appendTokensToSections(stubUS, [
      token({ name: "color-us", value: "#fff", type: "color" }),
    ]);
    const idx = (s: string) => result.indexOf(s);
    expect(idx("--color-us")).toBeGreaterThan(idx("## 2. Color System"));
    expect(idx("--color-us")).toBeLessThan(idx("## 3. Typography System"));
  });
});

describe("addTokenToLayoutMd (existing behaviour — regression guard)", () => {
  it("inserts into CORE TOKENS block", () => {
    const result = addTokenToLayoutMd(WISE_STUB, token({ name: "color-new", value: "#222", type: "color" }));
    const coreTokensBlock = result.match(/```css\s*\n\/\* ── CORE TOKENS ── \*\/[\s\S]*?\n```/)?.[0] ?? "";
    expect(coreTokensBlock).toContain("--color-new: #222;");
  });

  it("does not duplicate existing tokens", () => {
    const result = addTokenToLayoutMd(WISE_STUB, token({ name: "color-primary", value: "#DIFFERENT", type: "color" }));
    expect(result).toBe(WISE_STUB);
  });
});

describe("removeTokenFromLayoutMd (regression guard)", () => {
  it("removes the declaration line from the first block that contains it", () => {
    const result = removeTokenFromLayoutMd(WISE_STUB, { name: "color-primary", cssVariable: "--color-primary" });
    expect(result).not.toContain("--color-primary: #37517e;");
  });
});

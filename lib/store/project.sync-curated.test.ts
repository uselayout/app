import { describe, expect, it } from "vitest";
import { syncCuratedTokensToLayoutMd } from "./project";
import type { ProjectStandardisation } from "@/lib/types";

const synthesisedLayoutMd = `# layout.md — Perplexity UI

## 0. Quick Reference

\`\`\`css
/* === CORE TOKENS — Perplexity UI === */
--Offblack: #091717;           /* Primary dark surface / text */
--Paper-White: #fbfaf4;        /* Primary light surface */
--True-Turquoise: #20808d;     /* Brand primary action */
--Inky-Blue: #13343b;          /* Deepest brand background */
\`\`\`

## 2. Colour System

more prose follows
`;

const standardisation: ProjectStandardisation = {
  kitPrefix: "color",
  assignments: {
    "bg-app": {
      roleKey: "bg-app",
      originalName: "pure-white",
      originalCssVariable: "--pure-white",
      value: "#ffffff",
      standardName: "--color-bg-app",
      confidence: "high",
      userConfirmed: true,
    },
    "text-primary": {
      roleKey: "text-primary",
      originalName: "offblack",
      originalCssVariable: "--offblack",
      value: "#091717",
      standardName: "--color-text-primary",
      confidence: "high",
      userConfirmed: true,
    },
  },
  unassigned: [],
  antiPatterns: [],
  dismissedAntiPatterns: [],
  standardisedAt: "2026-04-20T00:00:00.000Z",
};

describe("syncCuratedTokensToLayoutMd", () => {
  it("replaces Claude's '=== CORE TOKENS — name ===' block with curated assignments (seed-bug regression)", () => {
    const result = syncCuratedTokensToLayoutMd(synthesisedLayoutMd, standardisation);

    // The stale synthesised tokens must be gone
    expect(result).not.toContain("--Offblack: #091717;");
    expect(result).not.toContain("--Inky-Blue: #13343b;");

    // The curated assignments must land inside the CORE TOKENS block
    expect(result).toContain("--color-bg-app: #ffffff;");
    expect(result).toContain("--color-text-primary: #091717;");

    // Prose outside the block is preserved
    expect(result).toContain("## 2. Colour System");
    expect(result).toContain("more prose follows");
  });

  it("is a no-op when there are no assignments", () => {
    const empty: ProjectStandardisation = {
      ...standardisation,
      assignments: {},
    };
    expect(syncCuratedTokensToLayoutMd(synthesisedLayoutMd, empty)).toBe(synthesisedLayoutMd);
  });

  it("is a no-op when no CORE TOKENS block exists in the document", () => {
    const noBlock = "# just prose\n\nno css blocks here\n";
    expect(syncCuratedTokensToLayoutMd(noBlock, standardisation)).toBe(noBlock);
  });

  it("replaces the sync's own '── CORE TOKENS ──' format on repeat runs (idempotent)", () => {
    const first = syncCuratedTokensToLayoutMd(synthesisedLayoutMd, standardisation);
    const second = syncCuratedTokensToLayoutMd(first, standardisation);
    expect(second).toBe(first);
  });
});

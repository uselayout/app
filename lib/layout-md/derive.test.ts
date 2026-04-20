import { describe, expect, it } from "vitest";
import { deriveLayoutMd, renderCoreTokensBlock } from "./derive";
import type { Project, ProjectStandardisation } from "@/lib/types";

const emptyStandardisation: ProjectStandardisation = {
  kitPrefix: "color",
  assignments: {},
  unassigned: [],
  antiPatterns: [],
  dismissedAntiPatterns: [],
  standardisedAt: "2026-04-20T00:00:00.000Z",
};

const curated: ProjectStandardisation = {
  ...emptyStandardisation,
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
    "radius-md": {
      roleKey: "radius-md",
      originalName: "radius-medium",
      originalCssVariable: "--radius-medium",
      value: "12px",
      standardName: "--radius-md",
      confidence: "high",
      userConfirmed: true,
    },
  },
};

const baseProject = (overrides: Partial<Project> = {}): Project =>
  ({
    id: "p1",
    orgId: "org1",
    name: "Perplexity",
    sourceType: "figma",
    layoutMd: "",
    createdAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    ...overrides,
  }) as Project;

const layoutMdWithSynthesisedCoreTokens = `# layout.md — Perplexity UI

## 0. Quick Reference

\`\`\`css
/* === CORE TOKENS — Perplexity UI === */
--Offblack: #091717;
--Inky-Blue: #13343b;
\`\`\`

## 1. Design Direction

Perplexity feels editorial.

## 2. Colour System

Colour prose goes here.
`;

describe("renderCoreTokensBlock", () => {
  it("emits an empty string when no assignments exist", () => {
    expect(renderCoreTokensBlock(emptyStandardisation)).toBe("");
  });

  it("renders colours and other roles into separate commented groups", () => {
    const block = renderCoreTokensBlock(curated);
    expect(block).toContain("/* Colours */");
    expect(block).toContain("--color-bg-app: #ffffff;");
    expect(block).toContain("--color-text-primary: #091717;");
    expect(block).toContain("/* Other */");
    expect(block).toContain("--radius-md: 12px;");
  });

  it("wraps output in a fenced CSS block with the standard comment header", () => {
    const block = renderCoreTokensBlock(curated);
    expect(block.startsWith("```css\n")).toBe(true);
    expect(block).toContain("/* ── CORE TOKENS ── */");
    expect(block.endsWith("```")).toBe(true);
  });
});

describe("deriveLayoutMd", () => {
  it("replaces the synthesised CORE TOKENS block with curated assignments (seed-bug fix, end-to-end)", () => {
    const md = deriveLayoutMd(
      baseProject({ layoutMd: layoutMdWithSynthesisedCoreTokens, standardisation: curated })
    );
    // Stale synthesised tokens gone
    expect(md).not.toContain("--Offblack:");
    expect(md).not.toContain("--Inky-Blue:");
    // Curated tokens present
    expect(md).toContain("--color-bg-app: #ffffff;");
    expect(md).toContain("--color-text-primary: #091717;");
  });

  it("preserves authored prose sections untouched", () => {
    const md = deriveLayoutMd(
      baseProject({ layoutMd: layoutMdWithSynthesisedCoreTokens, standardisation: curated })
    );
    expect(md).toContain("## 1. Design Direction");
    expect(md).toContain("Perplexity feels editorial.");
    expect(md).toContain("## 2. Colour System");
    expect(md).toContain("Colour prose goes here.");
  });

  it("is idempotent — deriving twice yields the same output", () => {
    const project = baseProject({ layoutMd: layoutMdWithSynthesisedCoreTokens, standardisation: curated });
    const first = deriveLayoutMd(project);
    const second = deriveLayoutMd({ ...project, layoutMd: first });
    expect(second).toBe(first);
  });

  it("regenerates on re-derive after the project.standardisation changes", () => {
    const project = baseProject({ layoutMd: layoutMdWithSynthesisedCoreTokens, standardisation: curated });
    const first = deriveLayoutMd(project);
    const changed: ProjectStandardisation = {
      ...curated,
      assignments: {
        ...curated.assignments,
        "bg-app": {
          ...curated.assignments["bg-app"],
          value: "#fafafa",
        },
      },
    };
    const second = deriveLayoutMd({ ...project, layoutMd: first, standardisation: changed });
    expect(second).toContain("--color-bg-app: #fafafa;");
    expect(second).not.toContain("--color-bg-app: #ffffff;");
  });

  it("returns layoutMd unchanged when there's no standardisation", () => {
    const project = baseProject({ layoutMd: layoutMdWithSynthesisedCoreTokens });
    expect(deriveLayoutMd(project)).toBe(layoutMdWithSynthesisedCoreTokens);
  });

  it("returns layoutMd unchanged when standardisation has no assignments", () => {
    const project = baseProject({
      layoutMd: layoutMdWithSynthesisedCoreTokens,
      standardisation: emptyStandardisation,
    });
    expect(deriveLayoutMd(project)).toBe(layoutMdWithSynthesisedCoreTokens);
  });

  it("respects skipCoreTokens option", () => {
    const project = baseProject({ layoutMd: layoutMdWithSynthesisedCoreTokens, standardisation: curated });
    expect(deriveLayoutMd(project, { skipCoreTokens: true })).toBe(layoutMdWithSynthesisedCoreTokens);
  });

  it("handles an empty layoutMd without throwing", () => {
    const project = baseProject({ layoutMd: "", standardisation: curated });
    expect(deriveLayoutMd(project)).toBe("");
  });
});

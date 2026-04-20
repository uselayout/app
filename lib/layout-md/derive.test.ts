import { describe, expect, it } from "vitest";
import { deriveLayoutMd, renderAppendixA, renderCoreTokensBlock } from "./derive";
import type { ExtractedToken, ExtractedTokens, Project, ProjectStandardisation } from "@/lib/types";

function token(partial: Partial<ExtractedToken> & Pick<ExtractedToken, "name" | "value" | "type">): ExtractedToken {
  return {
    category: "semantic",
    cssVariable: partial.cssVariable ?? `--${partial.name}`,
    ...partial,
  };
}

const fixtureTokens: ExtractedTokens = {
  colors: [
    token({ name: "pure-white", value: "#ffffff", type: "color", description: "App background" }),
    token({ name: "offblack", value: "#091717", type: "color" }),
  ],
  typography: [token({ name: "font-display", value: '"Geist", sans-serif', type: "typography" })],
  spacing: [token({ name: "space-1", value: "4px", type: "spacing" })],
  radius: [token({ name: "radius-md", value: "12px", type: "radius" })],
  effects: [],
  motion: [],
};

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

describe("renderAppendixA", () => {
  it("returns an empty string when every category is empty", () => {
    const empty: ExtractedTokens = { colors: [], typography: [], spacing: [], radius: [], effects: [], motion: [] };
    expect(renderAppendixA(empty)).toBe("");
  });

  it("groups tokens by category with category counts", () => {
    const rendered = renderAppendixA(fixtureTokens);
    expect(rendered).toContain("/* Colours (2) */");
    expect(rendered).toContain("/* Typography (1) */");
    expect(rendered).toContain("/* Spacing (1) */");
    expect(rendered).toContain("/* Radius (1) */");
    // Empty categories are omitted entirely (no "Motion (0)" noise)
    expect(rendered).not.toContain("Motion (0)");
    expect(rendered).not.toContain("Effects (0)");
  });

  it("emits the cssVariable and value with optional description", () => {
    const rendered = renderAppendixA(fixtureTokens);
    expect(rendered).toContain("--pure-white: #ffffff; /* App background */");
    expect(rendered).toContain("--offblack: #091717;");
  });

  it("appends mode to the comment for multi-mode tokens", () => {
    const multi: ExtractedTokens = {
      ...fixtureTokens,
      colors: [
        token({ name: "bg", value: "#ffffff", type: "color", mode: "light" }),
        token({ name: "bg", value: "#000000", type: "color", mode: "dark" }),
      ],
    };
    const rendered = renderAppendixA(multi);
    expect(rendered).toContain("--bg: #ffffff; /* mode: light */");
    expect(rendered).toContain("--bg: #000000; /* mode: dark */");
  });

  it("combines description and mode in a single trailing comment", () => {
    const combined: ExtractedTokens = {
      ...fixtureTokens,
      colors: [token({ name: "bg", value: "#fff", type: "color", description: "App bg", mode: "light" })],
    };
    expect(renderAppendixA(combined)).toContain("--bg: #fff; /* App bg — mode: light */");
  });
});

describe("deriveLayoutMd — Appendix A injection", () => {
  const layoutMdWithAppendixA = `# layout.md

## 1. Design Direction

prose

## Appendix A: Complete Token Reference

stale old content that should be replaced

\`\`\`css
/* Old */
--old: #000;
\`\`\`

## Appendix B: Token Source Metadata

tokenSource: figma
`;

  const layoutMdWithoutAppendix = `# layout.md

## 1. Design Direction

prose
`;

  it("replaces an existing Appendix A in place, leaving Appendix B intact", () => {
    const md = deriveLayoutMd(
      baseProject({
        layoutMd: layoutMdWithAppendixA,
        extractionData: { tokens: fixtureTokens, sourceType: "figma" } as never,
      })
    );
    expect(md).not.toContain("--old: #000;");
    expect(md).not.toContain("stale old content");
    expect(md).toContain("/* Colours (2) */");
    expect(md).toContain("--pure-white: #ffffff");
    // Appendix B preserved
    expect(md).toContain("## Appendix B: Token Source Metadata");
    expect(md).toContain("tokenSource: figma");
  });

  it("appends Appendix A when no such section exists", () => {
    const md = deriveLayoutMd(
      baseProject({
        layoutMd: layoutMdWithoutAppendix,
        extractionData: { tokens: fixtureTokens, sourceType: "figma" } as never,
      })
    );
    expect(md).toContain("## 1. Design Direction");
    expect(md).toContain("## Appendix A: Complete Token Reference");
    expect(md.indexOf("## 1. Design Direction")).toBeLessThan(md.indexOf("## Appendix A"));
  });

  it("inserts Appendix A before an existing Appendix B when A is missing", () => {
    const layoutMdOnlyB = `# layout.md

## 1. Prose

text

## Appendix B: Token Source Metadata

tokenSource: figma
`;
    const md = deriveLayoutMd(
      baseProject({
        layoutMd: layoutMdOnlyB,
        extractionData: { tokens: fixtureTokens, sourceType: "figma" } as never,
      })
    );
    expect(md.indexOf("## Appendix A")).toBeGreaterThan(md.indexOf("## 1. Prose"));
    expect(md.indexOf("## Appendix A")).toBeLessThan(md.indexOf("## Appendix B"));
  });

  it("is a no-op when the project has no extraction data", () => {
    const project = baseProject({ layoutMd: layoutMdWithoutAppendix });
    expect(deriveLayoutMd(project)).toBe(layoutMdWithoutAppendix);
  });

  it("respects skipAppendixA option", () => {
    const project = baseProject({
      layoutMd: layoutMdWithAppendixA,
      extractionData: { tokens: fixtureTokens, sourceType: "figma" } as never,
    });
    const md = deriveLayoutMd(project, { skipAppendixA: true });
    expect(md).toContain("--old: #000;");
    expect(md).toContain("stale old content");
  });

  it("regenerates Appendix A idempotently on repeat derive", () => {
    const project = baseProject({
      layoutMd: layoutMdWithoutAppendix,
      extractionData: { tokens: fixtureTokens, sourceType: "figma" } as never,
    });
    const first = deriveLayoutMd(project);
    const second = deriveLayoutMd({ ...project, layoutMd: first });
    expect(second).toBe(first);
  });
});

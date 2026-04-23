import { describe, expect, it } from "vitest";
import { deriveLayoutMd } from "./derive";
import type { Project, ProjectStandardisation } from "@/lib/types";

const curated: ProjectStandardisation = {
  kitPrefix: "color",
  assignments: {
    "bg-app": {
      roleKey: "bg-app",
      originalName: "white",
      value: "#ffffff",
      standardName: "--color-bg-app",
      confidence: "high",
      userConfirmed: true,
    },
  },
  unassigned: [],
  antiPatterns: [],
  dismissedAntiPatterns: [],
  standardisedAt: "2026-04-20T00:00:00.000Z",
};

const baseProject = (overrides: Partial<Project> = {}): Project =>
  ({
    id: "p1",
    orgId: "org1",
    name: "X",
    sourceType: "figma",
    layoutMd: "",
    createdAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    ...overrides,
  }) as Project;

describe("deriveLayoutMd — layoutMdAuthored preference (Phase 5)", () => {
  const legacyLayoutMd = `# layout.md

## 0. Quick Reference

\`\`\`css
/* === CORE TOKENS — stale === */
--Offblack: #091717;
\`\`\`

## 1. Design Direction

legacy prose

## Appendix A: Complete Token Reference

stale appendix content
`;

  const cleanAuthored = `# layout.md

## 1. Design Direction

authored prose only
`;

  it("prefers layoutMdAuthored over legacy layoutMd when both are present", () => {
    const project = baseProject({
      layoutMd: legacyLayoutMd,
      layoutMdAuthored: cleanAuthored,
      standardisation: curated,
    });
    const out = deriveLayoutMd(project);
    expect(out).toContain("authored prose only");
    expect(out).not.toContain("legacy prose");
    expect(out).not.toContain("--Offblack: #091717;");
    expect(out).not.toContain("stale appendix content");
  });

  it("falls back to legacy layoutMd when layoutMdAuthored is absent", () => {
    const project = baseProject({
      layoutMd: legacyLayoutMd,
      standardisation: curated,
    });
    const out = deriveLayoutMd(project);
    expect(out).toContain("legacy prose");
  });

  it("is idempotent when called with authored input", () => {
    const project = baseProject({
      layoutMdAuthored: cleanAuthored,
      standardisation: curated,
    });
    const first = deriveLayoutMd(project);
    const second = deriveLayoutMd({ ...project, layoutMdAuthored: first });
    // Deriving on top of derived output should be stable.
    expect(second).toBe(first);
  });

  it("injects derived CORE TOKENS into authored prose that contains a CORE TOKENS placeholder", () => {
    const authoredWithPlaceholder = `# layout.md

## 0. Quick Reference

\`\`\`css
/* === CORE TOKENS === */
\`\`\`

## 1. Design Direction

prose
`;
    const project = baseProject({
      layoutMdAuthored: authoredWithPlaceholder,
      standardisation: curated,
    });
    const out = deriveLayoutMd(project);
    expect(out).toContain("--color-bg-app: #ffffff;");
    expect(out).toContain("## 1. Design Direction");
  });
});

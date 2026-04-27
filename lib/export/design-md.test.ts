import { describe, it, expect } from "vitest";
import { generateDesignMd } from "./design-md";
import type { Project } from "@/lib/types";

function makeProject(overrides: Partial<Project> = {}): Pick<Project, "name" | "layoutMd" | "extractionData"> {
  return {
    name: "Acme",
    layoutMd: "## Quick Reference\n\nDark, minimal, developer-focused.",
    extractionData: {
      sourceType: "website",
      sourceName: "acme.com",
      tokens: {
        colors: [
          { name: "primary", value: "#6366F1", type: "color", category: "semantic", cssVariable: "--color-primary" },
          { name: "bg-app", value: "#0C0C0E", type: "color", category: "semantic", cssVariable: "--color-bg-app" },
        ],
        typography: [],
        spacing: [
          { name: "space-4", value: "16px", type: "spacing", category: "primitive", cssVariable: "--space-4" },
        ],
        radius: [],
        effects: [],
        motion: [],
      },
      components: [],
      screenshots: [],
      fonts: [],
      animations: [],
      librariesDetected: {},
      cssVariables: {},
      computedStyles: {},
    },
    ...overrides,
  };
}

describe("generateDesignMd", () => {
  it("emits YAML frontmatter followed by the layout.md prose", () => {
    const out = generateDesignMd(makeProject());
    expect(out.startsWith("---\n")).toBe(true);
    expect(out).toContain("---\n\n"); // closed frontmatter
    expect(out).toContain("name: Acme");
    expect(out).toContain('generator: "Layout (layout.design)"');
    expect(out).toContain("colors:");
    expect(out).toContain("primary: ");
    expect(out).toContain("Dark, minimal, developer-focused.");
  });

  it("preserves hex colour values unquoted where safe", () => {
    const out = generateDesignMd(makeProject());
    expect(out).toMatch(/primary: ["]?#6366F1["]?/);
  });

  it("omits empty token categories", () => {
    const p = makeProject();
    const out = generateDesignMd(p);
    expect(out).not.toContain("typography:\n---");
    expect(out).not.toContain("rounded:\n---");
  });

  it("handles projects with no extraction data gracefully", () => {
    const p = { name: "Blank", layoutMd: "# Blank", extractionData: undefined };
    const out = generateDesignMd(p);
    expect(out).toContain("name: Blank");
    expect(out).toContain("# Blank");
    expect(out).not.toContain("colors:");
  });

  it("preserves the layout.md body verbatim", () => {
    const layoutMd = "## Section\n\nSome **bold** prose\n\n### Sub\n\n- item";
    const out = generateDesignMd(makeProject({ layoutMd }));
    expect(out).toContain(layoutMd);
  });
});

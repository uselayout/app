import { describe, it, expect } from "vitest";
import { buildKitFromProject } from "./from-project";
import type { Project } from "@/lib/types";

const baseAuthor = { orgId: "org-1", userId: "user-1", displayName: "Tester" };

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "p1",
    orgId: "org-1",
    name: "Test Kit",
    sourceType: "manual",
    layoutMd: "",
    tokenCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as Project;
}

describe("buildKitFromProject — tokens.json comprehensiveness", () => {
  it("includes layout.md narrative tokens that aren't in extractionData", () => {
    // Linear-style scenario: the kit's layout.md narrative documents tokens
    // (accent-purple, surface-page, text-primary) that never made it into
    // extractionData. Pre-fix these dropped from tokens.json so the gallery
    // showed fewer tokens than the studio's All Tokens view (which reads
    // both sources via syncTokensFromLayoutMd).
    const layoutMd = [
      "# Test Kit",
      "",
      "## Quick Reference",
      "",
      "```css",
      ":root {",
      "  --accent-purple: #5e6ad2;",
      "  --surface-page: #0f1011;",
      "  --text-primary: #f7f8f8;",
      "  --normal-border: hsl(0, 0%, 93%);",
      "}",
      "```",
    ].join("\n");

    const result = buildKitFromProject({
      project: project({ layoutMd }),
      name: "Test",
      tags: [],
      licence: "mit",
      tier: "lite",
      author: baseAuthor,
      include: { components: false, fonts: false, branding: false, context: false },
    });

    const colours = result.tokensJson.color as Record<string, unknown> | undefined;
    expect(colours, "expected a color group in tokens.json").toBeDefined();
    const colourKeys = Object.keys(colours ?? {});
    expect(colourKeys).toContain("accentpurple");
    expect(colourKeys).toContain("surfacepage");
    expect(colourKeys).toContain("textprimary");
    expect(colourKeys).toContain("normalborder");
  });

  it("merges layout.md narrative on top of extractionData (extraction wins on collision)", () => {
    // If the same token name appears in both extractionData and layout.md,
    // the studio version is authoritative — that's where the user actively
    // edits tokens.
    const project1 = project({
      layoutMd: "```css\n:root { --bg-app: #ff0000; }\n```",
      extractionData: {
        sourceType: "manual",
        sourceName: "test",
        tokens: {
          colors: [{ name: "--bg-app", value: "#ffffff", type: "color", category: "semantic", cssVariable: "--bg-app" }],
          typography: [],
          spacing: [],
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
    });

    const result = buildKitFromProject({
      project: project1,
      name: "Test",
      tags: [],
      licence: "mit",
      tier: "lite",
      author: baseAuthor,
      include: { components: false, fonts: false, branding: false, context: false },
    });

    const colours = result.tokensJson.color as Record<string, { $value?: string }>;
    expect(colours["bgapp"].$value).toBe("#ffffff");
  });
});

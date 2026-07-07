import { describe, it, expect } from "vitest";
import { generateKitRegistryItem, parseCssVariables } from "./kit-registry";
import type { PublicKit } from "@/lib/types/kit";

function makeKit(overrides: Partial<PublicKit> = {}): PublicKit {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "test-kit",
    name: "Test Kit",
    description: "A dark, minimal starter kit.",
    tags: ["dark"],
    author: { orgId: "11111111-1111-1111-1111-111111111111" },
    licence: "MIT",
    layoutMd: "# Test Kit\n\nRules here.",
    tokensCss:
      ':root { --bg: #ffffff; --accent: #6750a4; }\n[data-theme="dark"] { --bg: #0c0c0e; }',
    tokensJson: { color: { bg: { $type: "color", $value: "#fff" } } },
    kitJson: {
      schemaVersion: 1,
      slug: "test-kit",
      name: "Test Kit",
      tags: ["dark"],
      licence: "MIT",
      author: { orgId: "11111111-1111-1111-1111-111111111111" },
      tier: "minimal",
      publishedAt: "2026-07-01T00:00:00.000Z",
    },
    tier: "minimal",
    featured: false,
    hidden: false,
    unlisted: false,
    isNew: false,
    bespokeShowcase: false,
    registryEnabled: true,
    marketingFeatured: false,
    status: "approved",
    cardImagePref: "auto",
    upvoteCount: 0,
    importCount: 0,
    viewCount: 0,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("parseCssVariables", () => {
  it("splits root and dark-mode declarations", () => {
    const vars = parseCssVariables(
      ':root { --bg: #fff; }\n[data-theme="dark"] { --bg: #000; }\n.dark { --fg: #eee; }',
    );
    expect(vars).toEqual([
      { name: "bg", value: "#fff", mode: undefined },
      { name: "bg", value: "#000", mode: "dark" },
      { name: "fg", value: "#eee", mode: "dark" },
    ]);
  });

  it("returns an empty list for CSS without custom properties", () => {
    expect(parseCssVariables("body { color: red; }")).toEqual([]);
  });
});

describe("generateKitRegistryItem", () => {
  it("emits a registry:base item with cssVars split by mode", () => {
    const item = generateKitRegistryItem(makeKit());

    expect(item.$schema).toBe("https://ui.shadcn.com/schema/registry-item.json");
    expect(item.name).toBe("test-kit");
    expect(item.type).toBe("registry:base");
    expect(item.title).toBe("Test Kit");
    expect(item.cssVars.theme).toEqual({ bg: "#ffffff", accent: "#6750a4" });
    expect(item.cssVars.dark).toEqual({ bg: "#0c0c0e" });
  });

  it("installs kit files into .layout/ via registry:file targets", () => {
    const item = generateKitRegistryItem(makeKit());
    const targets = item.files.map((f) => f.target);

    expect(targets).toEqual([
      "~/.layout/layout.md",
      "~/.layout/tokens.css",
      "~/.layout/tokens.json",
      "~/.layout/kit.json",
    ]);
    expect(item.files.every((f) => f.type === "registry:file")).toBe(true);
    expect(item.files[0].content).toContain("# Test Kit");
  });

  it("omits tokens.json file and cssVars when the kit has no tokens", () => {
    const item = generateKitRegistryItem(
      makeKit({ tokensCss: "", tokensJson: {} }),
    );
    expect(item.cssVars).toEqual({});
    expect(item.files.map((f) => f.target)).toEqual([
      "~/.layout/layout.md",
      "~/.layout/kit.json",
    ]);
  });
});

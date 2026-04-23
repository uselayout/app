import { describe, expect, it } from "vitest";
import { generateTailwindConfig } from "./tailwind-config";
import type { ExtractedTokens, ExtractedToken } from "@/lib/types";

function makeTokens(overrides: Partial<ExtractedTokens> = {}): ExtractedTokens {
  return {
    colors: [],
    typography: [],
    spacing: [],
    radius: [],
    effects: [],
    motion: [],
    ...overrides,
  };
}

function makeToken(
  name: string,
  value: string,
  type: ExtractedToken["type"] = "color",
  overrides: Partial<ExtractedToken> = {}
): ExtractedToken {
  return { name, value, type, category: "primitive", cssVariable: `--${name}`, ...overrides };
}

describe("generateTailwindConfig — multi-mode (Phase 3.5)", () => {
  it("omits darkMode config when no mode variants exist", () => {
    const config = generateTailwindConfig(
      makeTokens({
        colors: [makeToken("primary", "#6750A4")],
      })
    );
    expect(config).not.toContain("darkMode");
  });

  it("emits darkMode selector config when at least one token has a mode", () => {
    const config = generateTailwindConfig(
      makeTokens({
        colors: [
          makeToken("bg-app", "#ffffff"),
          makeToken("bg-app", "#000000", "color", { mode: "dark" }),
        ],
      })
    );
    expect(config).toContain('"darkMode"');
    expect(config).toContain('"selector"');
    expect(config).toContain('[data-theme=\\"dark\\"]');
  });

  it("references each colour token once by CSS variable, not per mode", () => {
    const config = generateTailwindConfig(
      makeTokens({
        colors: [
          makeToken("bg-app", "#ffffff"),
          makeToken("bg-app", "#000000", "color", { mode: "dark" }),
        ],
      })
    );
    // Only one "bg-app" key should appear in the extended colours — the CSS
    // cascade handles mode switching via the token's [data-theme] block.
    const matches = config.match(/"bg-app":\s*"var\(--bg-app\)"/g) ?? [];
    expect(matches.length).toBe(1);
  });
});

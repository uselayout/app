import { describe, it, expect } from "vitest";
import { seedModeAssignments, detectColourModes } from "./standardise";
import type { TokenAssignment } from "./standard-schema";
import type { ExtractedToken } from "@/lib/types";

function color(name: string, value: string, mode?: string): ExtractedToken {
  return { name, value, type: "color", category: "semantic", cssVariable: `--${name}`, mode };
}

function baseAssignment(roleKey: string, originalName: string, value: string): TokenAssignment {
  return {
    roleKey,
    originalName,
    originalCssVariable: `--${originalName}`,
    value,
    standardName: `--linear-${roleKey}`,
    confidence: "high",
    userConfirmed: false,
  };
}

describe("seedModeAssignments", () => {
  it("creates mode-tagged twins for tokens that exist in both modes", () => {
    const base = new Map<string, TokenAssignment>([
      ["bg-app", baseAssignment("bg-app", "background-default", "#ffffff")],
      ["text-primary", baseAssignment("text-primary", "text-default", "#111111")],
    ]);
    const allTokens: ExtractedToken[] = [
      color("background-default", "#ffffff", "SDS Light"),
      color("background-default", "#1e1e1e", "SDS Dark"),
      color("text-default", "#111111", "SDS Light"),
      color("text-default", "#f5f5f5", "SDS Dark"),
    ];

    const result = seedModeAssignments(base, allTokens, ["SDS Light", "SDS Dark"]);

    // Base assignments still present
    expect(result.has("bg-app")).toBe(true);
    expect(result.has("text-primary")).toBe(true);

    // Mode-tagged twins added
    const lightBg = result.get("bg-app::SDS Light");
    expect(lightBg).toBeDefined();
    expect(lightBg!.value).toBe("#ffffff");
    expect(lightBg!.mode).toBe("SDS Light");

    const darkBg = result.get("bg-app::SDS Dark");
    expect(darkBg).toBeDefined();
    expect(darkBg!.value).toBe("#1e1e1e");
    expect(darkBg!.mode).toBe("SDS Dark");

    const darkText = result.get("text-primary::SDS Dark");
    expect(darkText).toBeDefined();
    expect(darkText!.value).toBe("#f5f5f5");
  });

  it("skips a (role, mode) pair when no same-name token has that mode", () => {
    const base = new Map<string, TokenAssignment>([
      ["bg-app", baseAssignment("bg-app", "background-default", "#ffffff")],
    ]);
    const allTokens: ExtractedToken[] = [
      color("background-default", "#ffffff", "SDS Light"),
      // No SDS Dark twin
    ];

    const result = seedModeAssignments(base, allTokens, ["SDS Light", "SDS Dark"]);
    expect(result.has("bg-app::SDS Light")).toBe(true);
    expect(result.has("bg-app::SDS Dark")).toBe(false);
  });

  it("does not overwrite existing mode-tagged assignments", () => {
    const base = new Map<string, TokenAssignment>([
      ["bg-app", baseAssignment("bg-app", "background-default", "#ffffff")],
      [
        "bg-app::SDS Dark",
        { ...baseAssignment("bg-app", "user-pick-dark", "#000000"), mode: "SDS Dark", userConfirmed: true },
      ],
    ]);
    const allTokens: ExtractedToken[] = [
      color("background-default", "#1e1e1e", "SDS Dark"),
    ];

    const result = seedModeAssignments(base, allTokens, ["SDS Dark"]);
    const dark = result.get("bg-app::SDS Dark");
    expect(dark!.value).toBe("#000000"); // user override preserved
    expect(dark!.userConfirmed).toBe(true);
  });

  it("returns the input unchanged when modes is empty", () => {
    const base = new Map<string, TokenAssignment>([
      ["bg-app", baseAssignment("bg-app", "background-default", "#ffffff")],
    ]);
    const result = seedModeAssignments(base, [], []);
    expect(result.size).toBe(1);
    expect(result.has("bg-app")).toBe(true);
  });
});

describe("detectColourModes", () => {
  it("returns sorted unique modes from colour tokens only", () => {
    const tokens = {
      colors: [
        color("bg-default", "#fff", "SDS Light"),
        color("bg-default", "#000", "SDS Dark"),
        color("text", "#111", "SDS Light"),
      ],
      typography: [],
      // Spacing tokens have non-colour modes (Desktop/Mobile/Tablet on the
      // SDS file). detectColourModes must NOT surface those — Curated only
      // shows colour roles so non-colour modes would render as empty tabs.
      spacing: [{ name: "space-md", value: "16px", type: "spacing" as const, category: "semantic" as const, cssVariable: "--space-md", mode: "Desktop" }],
      radius: [],
      effects: [],
      motion: [],
    };
    const result = detectColourModes(tokens);
    expect(result).toEqual(["SDS Dark", "SDS Light"]);
    expect(result).not.toContain("Desktop");
  });

  it("returns empty array when no tokens are mode-tagged", () => {
    const tokens = {
      colors: [color("bg", "#fff")],
      typography: [], spacing: [], radius: [], effects: [], motion: [],
    };
    expect(detectColourModes(tokens)).toEqual([]);
  });
});

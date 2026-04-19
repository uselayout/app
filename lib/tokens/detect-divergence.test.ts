import { describe, it, expect } from "vitest";
import { detectTokenDivergence } from "./detect-divergence";
import type { ExtractionResult } from "@/lib/types";

function mkExtraction(overrides: Partial<ExtractionResult["tokens"]> = {}): ExtractionResult {
  return {
    sourceType: "website",
    sourceName: "test",
    tokens: {
      colors: [],
      typography: [],
      spacing: [],
      radius: [],
      effects: [],
      motion: [],
      ...overrides,
    },
    components: [],
    screenshots: [],
    fonts: [],
    animations: [],
    librariesDetected: {},
    cssVariables: {},
    computedStyles: {},
  };
}

describe("detectTokenDivergence — value normalisation", () => {
  it("does not flag whitespace-only differences in rgba values", () => {
    const layoutMd = "```css\n--fides-from: rgba(0,0,0,0.06);\n--fides-to: rgba(0,0,0,0.15);\n```";
    const extraction = mkExtraction({
      colors: [
        { name: "--fides-from", value: "rgba(0, 0, 0, 0.06)", type: "color", category: "semantic", cssVariable: "--fides-from" },
        { name: "--fides-to", value: "rgba(0, 0, 0, 0.15)", type: "color", category: "semantic", cssVariable: "--fides-to" },
      ],
    });
    const report = detectTokenDivergence(layoutMd, extraction);
    expect(report.valueDivergences).toEqual([]);
  });

  it("does not flag whitespace-only differences in box-shadow values", () => {
    const layoutMd = "```css\n--shadow-focus: 0px 4px 12px rgba(0,0,0,0.1);\n```";
    const extraction = mkExtraction({
      effects: [
        { name: "--shadow-focus", value: "0px 4px 12px rgba(0, 0, 0, 0.1)", type: "effect", category: "semantic", cssVariable: "--shadow-focus" },
      ],
    });
    const report = detectTokenDivergence(layoutMd, extraction);
    expect(report.valueDivergences).toEqual([]);
  });

  it("does not flag short-form vs long-form hex", () => {
    const layoutMd = "```css\n--accent: #fff;\n```";
    const extraction = mkExtraction({
      colors: [
        { name: "--accent", value: "#FFFFFF", type: "color", category: "semantic", cssVariable: "--accent" },
      ],
    });
    const report = detectTokenDivergence(layoutMd, extraction);
    expect(report.valueDivergences).toEqual([]);
  });

  it("still flags genuinely different values", () => {
    const layoutMd = "```css\n--accent: #0a4b19;\n```";
    const extraction = mkExtraction({
      colors: [
        { name: "--accent", value: "#123456", type: "color", category: "semantic", cssVariable: "--accent" },
      ],
    });
    const report = detectTokenDivergence(layoutMd, extraction);
    expect(report.valueDivergences.length).toBe(1);
    expect(report.valueDivergences[0].name).toBe("--accent");
  });

  it("still flags different rgba alpha values", () => {
    const layoutMd = "```css\n--overlay: rgba(0, 0, 0, 0.2);\n```";
    const extraction = mkExtraction({
      colors: [
        { name: "--overlay", value: "rgba(0,0,0,0.5)", type: "color", category: "semantic", cssVariable: "--overlay" },
      ],
    });
    const report = detectTokenDivergence(layoutMd, extraction);
    expect(report.valueDivergences.length).toBe(1);
  });
});

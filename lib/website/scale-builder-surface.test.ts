import { describe, expect, it } from "vitest";
import { buildSurfaceColoursFromCensus } from "./scale-builder";

type Census = Parameters<typeof buildSurfaceColoursFromCensus>[0];

function el(area: number, text = "", tag = "div"): { tag: string; text: string; area: number; color: string } {
  return { tag, text, area, color: "#000" };
}

describe("buildSurfaceColoursFromCensus", () => {
  it("returns empty when census is undefined or empty", () => {
    expect(buildSurfaceColoursFromCensus(undefined)).toEqual([]);
    expect(buildSurfaceColoursFromCensus({})).toEqual([]);
  });

  it("emits up to N saturated tokens for a Headspace-like multi-colour palette", () => {
    const census: Census = {
      "rgb(255, 206, 0)":   { count: 3, elements: [el(80_000, "Phone mockup card")] },     // yellow
      "rgb(255, 128, 171)": { count: 2, elements: [el(60_000, "Always-there support")] }, // pink
      "rgb(123, 87, 211)":  { count: 2, elements: [el(50_000, "Sleepcast tile")] },        // purple
      "rgb(255, 144, 80)":  { count: 1, elements: [el(20_000, "Practice meditation")] },   // orange
    };
    const out = buildSurfaceColoursFromCensus(census);
    expect(out.length).toBeGreaterThanOrEqual(3);
    const values = out.map((t) => t.value);
    expect(values).toContain("rgb(255, 206, 0)");   // yellow survived
    expect(values).toContain("rgb(255, 128, 171)"); // pink survived
    expect(values).toContain("rgb(123, 87, 211)");  // purple survived
    out.forEach((t) => {
      expect(t.cssVariable).toMatch(/^--brand-surface-\d+$/);
      expect(t.groupName).toBe("Brand");
      expect(t.type).toBe("color");
    });
  });

  it("dedupes near-duplicate hues — keeps the higher-scoring of two yellows", () => {
    const census: Census = {
      "rgb(255, 206, 0)": { count: 4, elements: [el(80_000, "Big yellow")] },     // dominant
      "rgb(252, 200, 8)": { count: 1, elements: [el(2_000, "Tint variant")] },     // near-duplicate hue
    };
    const out = buildSurfaceColoursFromCensus(census);
    expect(out).toHaveLength(1);
    expect(out[0].value).toBe("rgb(255, 206, 0)");
  });

  it("drops greys, near-whites, and near-blacks before scoring", () => {
    const census: Census = {
      "rgb(255, 255, 255)": { count: 50, elements: [el(999_999)] },
      "rgb(0, 0, 0)":       { count: 50, elements: [el(999_999)] },
      "rgb(128, 128, 128)": { count: 50, elements: [el(999_999)] },
    };
    expect(buildSurfaceColoursFromCensus(census)).toEqual([]);
  });

  it("rejects colours with too little total area", () => {
    const census: Census = {
      "rgb(255, 206, 0)": { count: 1, elements: [el(500)] }, // 500px² total — under threshold
    };
    expect(buildSurfaceColoursFromCensus(census)).toEqual([]);
  });

  it("respects the maxTokens cap", () => {
    const census: Census = {
      "rgb(255, 206, 0)":   { count: 3, elements: [el(80_000)] },  // yellow
      "rgb(255, 128, 171)": { count: 3, elements: [el(80_000)] },  // pink
      "rgb(123, 87, 211)":  { count: 3, elements: [el(80_000)] },  // purple
      "rgb(80, 200, 120)":  { count: 3, elements: [el(80_000)] },  // green
      "rgb(0, 162, 221)":   { count: 3, elements: [el(80_000)] },  // blue
    };
    const out = buildSurfaceColoursFromCensus(census, 2);
    expect(out).toHaveLength(2);
  });
});

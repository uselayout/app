import { describe, expect, it } from "vitest";
import { buildColourTokensFromCensus } from "./scale-builder";

type Census = Parameters<typeof buildColourTokensFromCensus>[0];

function el(area: number, text = "", tag = "button"): { tag: string; text: string; area: number; color: string } {
  return { tag, text, area, color: "#fff" };
}

describe("buildColourTokensFromCensus", () => {
  it("returns empty when census is undefined or empty", () => {
    expect(buildColourTokensFromCensus(undefined)).toEqual([]);
    expect(buildColourTokensFromCensus({})).toEqual([]);
  });

  it("picks the dominant lime CTA as --brand-primary-cta on wise-like input", () => {
    const census: Census = {
      "rgb(159, 232, 112)": { count: 12, elements: [el(80_000, "Open account"), el(20_000, "Send money"), el(5_000)] },
      "rgb(0, 162, 221)": { count: 3, elements: [el(2_500, "Log in")] },
      "rgb(237, 238, 236)": { count: 8, elements: [el(1_200)] }, // near-white — must be dropped
      "rgb(134, 134, 133)": { count: 4, elements: [el(800)] },   // grey — must be dropped
    };
    const out = buildColourTokensFromCensus(census);
    expect(out[0].cssVariable).toBe("--brand-primary-cta");
    expect(out[0].value).toBe("rgb(159, 232, 112)");
    expect(out[0].groupName).toBe("Brand");
    expect(out[0].type).toBe("color");
  });

  it("emits a secondary CTA token when a distinct hue exists", () => {
    const census: Census = {
      "rgb(159, 232, 112)": { count: 10, elements: [el(50_000, "Primary")] },
      "rgb(0, 162, 221)":   { count: 4,  elements: [el(8_000, "Secondary")] },
    };
    const out = buildColourTokensFromCensus(census);
    expect(out).toHaveLength(2);
    expect(out[1].cssVariable).toBe("--brand-secondary-cta");
    expect(out[1].value).toBe("rgb(0, 162, 221)");
  });

  it("does not emit a secondary token when only one distinct hue exists", () => {
    const census: Census = {
      "rgb(159, 232, 112)": { count: 10, elements: [el(50_000)] },
      "rgb(160, 230, 110)": { count: 2,  elements: [el(200)] }, // near-duplicate hue
    };
    const out = buildColourTokensFromCensus(census);
    expect(out).toHaveLength(1);
  });

  it("drops near-whites, near-blacks, and greys", () => {
    const census: Census = {
      "rgb(255, 255, 255)": { count: 50, elements: [el(999_999)] },
      "rgb(0, 0, 0)":       { count: 50, elements: [el(999_999)] },
      "rgb(128, 128, 128)": { count: 50, elements: [el(999_999)] },
    };
    expect(buildColourTokensFromCensus(census)).toEqual([]);
  });

  it("prefers hero-sized buttons (area weighting) over icon-sized buttons", () => {
    const census: Census = {
      // Icon-sized: high count, tiny area
      "rgb(255, 0, 0)":     { count: 100, elements: [el(100)] },
      // Hero-sized: low count, huge area
      "rgb(159, 232, 112)": { count: 3,   elements: [el(120_000, "Open account")] },
    };
    const out = buildColourTokensFromCensus(census);
    expect(out[0].value).toBe("rgb(159, 232, 112)");
  });
});

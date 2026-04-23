import { describe, it, expect } from "vitest";
import { buildLayoutDigest } from "./layout-digest";
import type { ExtractionResult } from "@/lib/types";

function baseResult(overrides: Partial<ExtractionResult> = {}): ExtractionResult {
  return {
    sourceType: "website",
    sourceName: "test",
    tokens: { colors: [], typography: [], spacing: [], radius: [], effects: [], motion: [] },
    components: [],
    screenshots: [],
    fonts: [],
    animations: [],
    librariesDetected: {},
    cssVariables: {},
    computedStyles: {},
    ...overrides,
  };
}

describe("buildLayoutDigest", () => {
  it("returns null when extraction has nothing useful", () => {
    expect(buildLayoutDigest(baseResult())).toBeNull();
  });

  it("reports probable page sections inferred from component names", () => {
    const digest = buildLayoutDigest(
      baseResult({
        components: [
          { name: "NavBar", variantCount: 1 },
          { name: "HeroSection", variantCount: 1 },
          { name: "FeatureCard", variantCount: 3 },
          { name: "TestimonialQuote", variantCount: 1 },
          { name: "PricingTier", variantCount: 3 },
          { name: "FooterLinks", variantCount: 1 },
        ],
      })
    );
    expect(digest).not.toBeNull();
    expect(digest).toContain("Probable page sections");
    expect(digest).toContain("Nav/Header");
    expect(digest).toContain("Hero");
    expect(digest).toContain("Feature/Card grid");
    expect(digest).toContain("Testimonials");
    expect(digest).toContain("Pricing");
    expect(digest).toContain("Footer");
  });

  it("summarises Figma auto-layout patterns", () => {
    const digest = buildLayoutDigest(
      baseResult({
        layoutPatterns: [
          { direction: "HORIZONTAL", mainAxis: "SPACE_BETWEEN", crossAxis: "CENTER", count: 12 },
          { direction: "VERTICAL", mainAxis: "MIN", crossAxis: "MIN", count: 8 },
        ],
      })
    );
    expect(digest).toContain("auto-layout patterns");
    expect(digest).toContain("HORIZONTAL");
    expect(digest).toContain("×12");
  });

  it("emits structural layout from computed styles when present", () => {
    const digest = buildLayoutDigest(
      baseResult({
        computedStyles: {
          card: {
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            padding: "24px",
          },
          role_navigation: {
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          },
        },
      })
    );
    expect(digest).toContain("Structural layout signals");
    expect(digest).toContain("card");
    expect(digest).toContain("flex:column");
    expect(digest).toContain("gap:16px");
    expect(digest).toContain("role_navigation");
  });

  it("reports primary CTA dominance from button census", () => {
    const digest = buildLayoutDigest(
      baseResult({
        buttonColourCensus: {
          "rgb(10, 75, 25)": {
            count: 7,
            elements: [{ tag: "button", text: "Get started", area: 8000, color: "#fff" }],
          },
          "rgb(255, 255, 255)": {
            count: 2,
            elements: [{ tag: "a", text: "Learn more", area: 4000, color: "#000" }],
          },
        },
      })
    );
    expect(digest).toContain("Primary CTA dominance");
    expect(digest).toContain("rgb(10, 75, 25)");
    expect(digest).toContain("×7");
    expect(digest).toContain("Get started");
  });

  it("emits typographic hierarchy when at least two sizes are present", () => {
    const digest = buildLayoutDigest(
      baseResult({
        computedStyles: {
          h1: { fontSize: "48px", fontWeight: "700" },
          h2: { fontSize: "32px", fontWeight: "600" },
          body: { fontSize: "16px", fontWeight: "400" },
        },
      })
    );
    expect(digest).toContain("Typographic hierarchy");
    expect(digest).toContain("h1:48px 700");
    expect(digest).toContain("body:16px 400");
  });

  it("includes detected breakpoints", () => {
    const digest = buildLayoutDigest(
      baseResult({
        breakpoints: ["640px", "768px", "1024px"],
      })
    );
    expect(digest).toContain("breakpoints");
    expect(digest).toContain("640px, 768px, 1024px");
  });
});

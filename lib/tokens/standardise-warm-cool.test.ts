import { describe, expect, it } from "vitest";
import { standardiseTokens } from "./standardise";
import type { ExtractedTokens, ExtractedToken } from "@/lib/types";

function colourToken(name: string, value: string, cssVariable?: string): ExtractedToken {
  return {
    name,
    value,
    type: "color",
    category: "semantic",
    cssVariable: cssVariable ?? `--${name}`,
  };
}

function buildTokens(colors: ExtractedToken[]): ExtractedTokens {
  return { colors, typography: [], spacing: [], radius: [], effects: [], motion: [] };
}

// Each fixture must include a clearly-named accent token (e.g. --cta-primary)
// so Pass 1's name-based matcher fills the `accent` role first. Surface
// colours are kept under fully neutral names (--surface-N) so they don't
// match any role by name and have to flow through Pass 3 — which is what
// we're testing.

describe("standardiseTokens — warm/cool fallback assignment", () => {
  it("assigns Headspace yellow #FFCE00 to accent-warm via Pass 3 hue-range picker", () => {
    const tokens = buildTokens([
      colourToken("cta-primary", "#0040ea"),  // accent (Pass 1, "cta" keyword)
      colourToken("swatch-1",    "#FFCE00"),  // yellow → accent-warm (Pass 3)
      colourToken("text-body",   "#1c1b1f"),
      colourToken("background-app", "#ffffff"),
    ]);
    const result = standardiseTokens(tokens, "https://headspace.com");
    expect(result.assignments.get("accent-warm")?.value).toBe("#FFCE00");
  });

  it("assigns yellow to warning when accent-warm is already filled by name (relaxed g<230 heuristic)", () => {
    const tokens = buildTokens([
      colourToken("cta-primary", "#0040ea"),                  // accent
      colourToken("brand-warm", "#FF80AB", "--brand-warm"),   // accent-warm (Pass 1, "brand-warm" keyword)
      colourToken("swatch-1",    "#FFCE00"),                  // yellow → warning (Pass 3, g=206 < 230 ✓)
      colourToken("text-body",   "#1c1b1f"),
      colourToken("background-app", "#ffffff"),
    ]);
    const result = standardiseTokens(tokens, "https://headspace.com");
    expect(result.assignments.get("accent-warm")?.value).toBe("#FF80AB");
    expect(result.assignments.get("warning")?.value).toBe("#FFCE00");
  });

  it("distributes yellow → accent-warm and purple → accent-cool in a multi-surface palette", () => {
    const tokens = buildTokens([
      colourToken("cta-primary", "#0040ea"),  // accent
      colourToken("swatch-1",    "#FFCE00"),  // yellow → accent-warm (highest chroma warm)
      colourToken("swatch-2",    "#7B57D3"),  // purple (hue ~258°) → accent-cool
      colourToken("text-body",   "#1c1b1f"),
      colourToken("background-app", "#ffffff"),
    ]);
    const result = standardiseTokens(tokens, "https://headspace.com");
    expect(result.assignments.get("accent-warm")?.value).toBe("#FFCE00");
    expect(result.assignments.get("accent-cool")?.value).toBe("#7B57D3");
  });

  it("leaves accent-warm and accent-cool unassigned when no qualifying colours exist", () => {
    const tokens = buildTokens([
      colourToken("text-body", "#1c1b1f"),
      colourToken("background-app", "#ffffff"),
      colourToken("border-default", "#e0e0e0"),
    ]);
    const result = standardiseTokens(tokens, "https://example.com");
    expect(result.assignments.has("accent-warm")).toBe(false);
    expect(result.assignments.has("accent-cool")).toBe(false);
  });

  it("does not pick a low-chroma colour even if its hue is in the warm range", () => {
    const tokens = buildTokens([
      // Beige: hue ~36°, chroma ~0.16 — borderline; here we use a much
      // closer-to-grey value to confirm the chroma > 0.15 gate kicks in.
      colourToken("tile-stone", "#d8d2cc"),  // chroma ~0.05
      colourToken("text-body", "#1c1b1f"),
      colourToken("background-app", "#ffffff"),
    ]);
    const result = standardiseTokens(tokens, "https://example.com");
    expect(result.assignments.has("accent-warm")).toBe(false);
  });
});

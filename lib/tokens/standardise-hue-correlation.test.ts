import { describe, expect, it } from "vitest";
import { standardiseTokens } from "./standardise";
import type { ExtractedToken, ExtractedTokens } from "@/lib/types";

function color(name: string, value: string): ExtractedToken {
  return { name, value, type: "color", category: "semantic", cssVariable: `--${name}` };
}

function tokens(colors: ExtractedToken[]): ExtractedTokens {
  return { colors, typography: [], spacing: [], radius: [], effects: [], motion: [] };
}

describe("standardise hue-correlation post-pass (B1 — Wise accent-hover)", () => {
  it("drops accent-hover when the only candidate is in a different hue family from accent", () => {
    // Wise scenario: green CTA wins accent, but the only accent-hover-named
    // candidate is a blue link-hover. We'd rather leave the slot empty than
    // confidently pick an off-brand colour.
    const map = standardiseTokens(
      tokens([
        color("color-cta-primary-bg", "rgb(159, 232, 112)"),      // green accent
        color("color-content-accent-hover", "#0084b3"),            // blue hover — off-brand
      ]),
      "wise.com"
    );
    expect(map.assignments.get("accent")?.originalName).toBe("color-cta-primary-bg");
    expect(
      map.assignments.get("accent-hover"),
      "expected accent-hover to be dropped when only candidate is off-brand"
    ).toBeUndefined();
  });

  it("keeps accent-hover when it's close in hue to accent", () => {
    // Similar hue family (greens ~80-140°) — the hover should stick.
    // Use `brand-primary-hover` rather than `*-hover-bg` so the bg-hover role
    // (which matches the `hover` keyword earlier in iteration) doesn't claim
    // the token via its weaker score — that's a different, real bug worth
    // tracking separately.
    const map = standardiseTokens(
      tokens([
        color("color-cta-primary-bg", "rgb(159, 232, 112)"),    // green accent
        color("color-brand-primary-hover", "rgb(120, 200, 80)"), // darker green hover — on-brand
      ]),
      "wise.com"
    );
    expect(map.assignments.get("accent")?.originalName).toBe("color-cta-primary-bg");
    const hover = map.assignments.get("accent-hover");
    expect(hover, "expected accent-hover to be assigned to the on-brand green hover").toBeDefined();
    expect(hover!.originalName).toBe("color-brand-primary-hover");
  });

  it("swaps to a close-hue replacement when the first pick was off-brand", () => {
    // Wise-ish with BOTH an off-brand hover name AND a same-hue alternative
    // whose name doesn't include `hover`. The post-pass should drop the
    // off-brand pick and swap in the close-hue candidate.
    //
    // Include dedicated bg / text tokens so the Pass-3 value-based fallbacks
    // don't steal our brand-primary-hover as the "lightest unassigned colour"
    // before the post-pass gets a chance to reuse it.
    const map = standardiseTokens(
      tokens([
        color("color-bg-app", "#ffffff"),
        color("color-text-primary", "#0c0c0e"),
        color("color-cta-primary-bg", "rgb(159, 232, 112)"),       // green accent
        color("color-content-accent-hover", "#0084b3"),             // blue — wrong family
        color("color-brand-primary-hover", "rgb(100, 180, 70)"),    // green — right family
      ]),
      "wise.com"
    );
    const hover = map.assignments.get("accent-hover");
    expect(hover, "expected a replacement in the same hue family").toBeDefined();
    // Must NOT be the blue off-brand option.
    expect(hover!.value).not.toBe("#0084b3");
  });
});

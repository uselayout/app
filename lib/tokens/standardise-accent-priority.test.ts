import { describe, expect, it } from "vitest";
import { standardiseTokens } from "./standardise";
import type { ExtractedToken, ExtractedTokens } from "@/lib/types";

function color(name: string, value: string): ExtractedToken {
  return { name, value, type: "color", category: "semantic", cssVariable: `--${name}` };
}

function tokens(colors: ExtractedToken[]): ExtractedTokens {
  return { colors, typography: [], spacing: [], radius: [], effects: [], motion: [] };
}

describe("standardise accent priority (TF2 / TF5 regression — Wise scenario)", () => {
  it("picks the CTA primary token for the accent role over an interactive/link token", () => {
    // Wise raw tokens simplified: both tokens could match the accent role
    // by name. Before the keywordWeights fix, --color-interactive-accent
    // won by virtue of being encountered earlier. Now --color-cta-primary-bg
    // should win because `cta` is weighted higher than `interactive`.
    const map = standardiseTokens(
      tokens([
        color("color-interactive-accent", "#00a2dd"), // Wise link blue
        color("color-cta-primary-bg", "rgb(159, 232, 112)"), // Wise green CTA
      ]),
      "wise.com"
    );
    const accentAssignment = map.assignments.get("accent");
    expect(accentAssignment, "expected an accent assignment").toBeDefined();
    expect(accentAssignment!.originalName).toBe("color-cta-primary-bg");
  });

  it("routes cta-primary-text to the accent-foreground role", () => {
    const map = standardiseTokens(
      tokens([
        color("color-cta-primary-bg", "rgb(159, 232, 112)"),
        color("color-cta-primary-text", "rgb(22, 51, 0)"),
      ]),
      "wise.com"
    );
    const onAccent = map.assignments.get("accent-foreground");
    expect(onAccent, "expected an accent-foreground assignment").toBeDefined();
    expect(onAccent!.originalName).toBe("color-cta-primary-text");
  });

  it("routes cta-secondary-bg to the accent-hover role", () => {
    const map = standardiseTokens(
      tokens([
        color("color-cta-primary-bg", "rgb(159, 232, 112)"),
        color("color-cta-secondary-bg", "rgb(22, 51, 0)"),
      ]),
      "wise.com"
    );
    const hover = map.assignments.get("accent-hover");
    expect(hover, "expected an accent-hover assignment").toBeDefined();
    expect(hover!.originalName).toBe("color-cta-secondary-bg");
  });

  it("still picks accent when no CTA tokens exist (no regression for non-Wise kits)", () => {
    const map = standardiseTokens(
      tokens([
        color("color-primary", "#5e6ad2"),
        color("color-link", "#4ea7fc"),
      ]),
      "linear.app"
    );
    const accent = map.assignments.get("accent");
    expect(accent).toBeDefined();
    // Either primary or link is fine — both are legitimate accent candidates.
    expect(["color-primary", "color-link"]).toContain(accent!.originalName);
  });
});

import { describe, expect, it } from "vitest";
import { standardiseTokens } from "./standardise";
import type { ExtractedToken, ExtractedTokens } from "@/lib/types";

function color(name: string, value: string): ExtractedToken {
  return { name, value, type: "color", category: "semantic", cssVariable: `--${name}` };
}

function tokens(colors: ExtractedToken[]): ExtractedTokens {
  return { colors, typography: [], spacing: [], radius: [], effects: [], motion: [] };
}

describe("standardise status-prefix demotion (Linear scenario)", () => {
  it("picks normal-border over success-border for the default border role", () => {
    // Linear's borders include success-border, info-border, warning-border,
    // error-border (status states) and normal-border (the default). Without
    // the demotion both tied at 9 points (suffix +5, keyword +3, overlap +1)
    // and iteration order picked success-border, hiding the actual default
    // border behind a status colour.
    const map = standardiseTokens(
      tokens([
        color("success-border", "hsl(145, 92%, 87%)"),
        color("info-border", "hsl(221, 91%, 93%)"),
        color("warning-border", "hsl(49, 91%, 84%)"),
        color("error-border", "hsl(359, 100%, 94%)"),
        color("normal-border", "hsl(0, 0%, 93%)"),
        color("normal-border-hover", "hsl(0, 0%, 25%)"),
      ]),
      "linear.app"
    );

    const borderAssignment = map.assignments.get("border");
    expect(borderAssignment, "expected a default border assignment").toBeDefined();
    expect(borderAssignment!.originalName).toBe("normal-border");
  });

  it("still routes success-border to the success role", () => {
    const map = standardiseTokens(
      tokens([
        color("success-border", "hsl(145, 92%, 87%)"),
        color("normal-border", "hsl(0, 0%, 93%)"),
      ]),
      "linear.app"
    );

    const successAssignment = map.assignments.get("success");
    expect(successAssignment, "expected a success assignment").toBeDefined();
    expect(successAssignment!.originalName).toBe("success-border");
  });

  it("picks normal-border over border-success (suffix form) for the default border role", () => {
    // Same problem in mirror form: some kits use bg-success / border-error /
    // text-warning rather than success-bg / error-border. Segment-based
    // detection catches both.
    const map = standardiseTokens(
      tokens([
        color("border-success", "hsl(145, 92%, 87%)"),
        color("border-error", "hsl(359, 100%, 94%)"),
        color("normal-border", "hsl(0, 0%, 93%)"),
      ]),
      "linear.app"
    );

    const borderAssignment = map.assignments.get("border");
    expect(borderAssignment, "expected a default border assignment").toBeDefined();
    expect(borderAssignment!.originalName).toBe("normal-border");
  });

  it("does not demote status-flavoured tokens for the status category", () => {
    // success-* tokens should still flow into status roles. They tie with
    // each other on score so iteration order picks one for `success` and
    // others go unassigned, but importantly NONE are demoted just for
    // having a status prefix — the demotion is only against default-tier
    // colour roles.
    const map = standardiseTokens(
      tokens([
        color("success", "hsl(145, 92%, 50%)"),
        color("success-bg", "hsl(145, 50%, 95%)"),
      ]),
      "linear.app"
    );

    const success = map.assignments.get("success");
    expect(success, "expected a success assignment").toBeDefined();
    expect(success!.originalName).toBe("success");
  });
});

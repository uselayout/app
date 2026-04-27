import { describe, it, expect } from "vitest";
import { KIT_SHOWCASE_TSX } from "./kit-showcase-source";

// The showcase logic ships as a TSX-as-string that the iframe transpiles at
// mount time, so the picker functions can't be unit-tested directly. These
// tests assert the source string contains the regression-critical patterns
// — specifically the pickBorder fix (the green-card bug) and the luminance-
// derived button text colour — so a refactor can't silently undo them.

describe("kit-showcase-source — pickBorder", () => {
  it("filters semantic-state stems out of border candidates", () => {
    expect(KIT_SHOWCASE_TSX).toMatch(
      /STATE\s*=\s*\/\(success\|error\|warning\|info\|danger\|positive\|negative\|caution\|critical\)\/i/,
    );
  });

  it("priority list explicitly includes -border-default and -border-subtle", () => {
    expect(KIT_SHOWCASE_TSX).toContain('"--color-border-default"');
    expect(KIT_SHOWCASE_TSX).toContain('"--color-border-subtle"');
  });

  it("end-anchored fallback patterns survive on neutral names", () => {
    expect(KIT_SHOWCASE_TSX).toMatch(/-border\$/);
    expect(KIT_SHOWCASE_TSX).toMatch(/-border-default\$/);
    expect(KIT_SHOWCASE_TSX).toMatch(/-border-subtle\$/);
  });
});

describe("kit-showcase-source — button text contrast", () => {
  it("primary button text is luminance-derived, not hardcoded", () => {
    // The bug was a hardcoded \`#08090a\` used as label colour on every
    // primary/accept button. Now the source must derive label colour via
    // onColour(props.accent), which returns white or near-black based on
    // luminance.
    expect(KIT_SHOWCASE_TSX).toContain("onColour(props.accent)");
  });

  it("onColour helper exists in the source", () => {
    expect(KIT_SHOWCASE_TSX).toMatch(/function\s+onColour\(/);
    expect(KIT_SHOWCASE_TSX).toMatch(/luminance\(bg\)\s*<\s*0\.5/);
  });
});

describe("kit-showcase-source — neutral spacing/radius fills", () => {
  it("withAlpha helper is used to derive neutral fills from text colour", () => {
    expect(KIT_SHOWCASE_TSX).toMatch(/function\s+withAlpha\(/);
    expect(KIT_SHOWCASE_TSX).toContain("withAlpha(props.text");
  });
});

describe("kit-showcase-source — expanded component coverage", () => {
  // Locks the rich showcase the gallery now ships. If a refactor accidentally
  // reverts to the thin "Buttons + Input + Card" version these will fail.
  const blocks = [
    "ButtonsBlock",
    "InputsBlock",
    "FormStatesRow",
    "ControlsBlock",
    "StatusBadgesBlock",
    "TabsBlock",
    "AvatarsBlock",
    "ProgressBlock",
    "AlertBlock",
    "StatTilesRow",
    "CardBlock",
    "DataTablePreview",
  ];
  it.each(blocks)("contains %s helper", (name) => {
    expect(KIT_SHOWCASE_TSX).toContain("function " + name);
  });
});

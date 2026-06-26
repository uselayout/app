import { describe, it, expect } from "vitest";
import {
  parseStyleProfile,
  repairProfileContrast,
  DEFAULT_STYLE_PROFILE,
  type KitStyleColours,
} from "./kit-style-profile";

// The Dovetail kit shipped an internally inconsistent palette: a light bg with
// white text/headings and a saturated blue surface. Each colour is individually
// valid, so the field validators pass — the repair pass is what makes them
// legible together.
const DOVETAIL_BROKEN: KitStyleColours = {
  bg: "#fafafa",
  surface: "rgb(0, 68, 255)",
  surfaceElevated: "rgb(13, 157, 218)",
  text: "rgb(250, 250, 250)",
  headingText: "rgb(255, 255, 255)",
  textMuted: "rgba(255, 255, 255, 0.64)",
  accent: "rgb(0, 68, 255)",
  accentHover: "rgb(0, 50, 210)",
  accentSubtle: "rgba(0, 68, 255, 0.10)",
  onAccent: "rgb(255, 255, 255)",
  border: "rgba(255, 255, 255, 0.16)",
  borderStrong: "rgb(255, 255, 255)",
  success: "rgb(13,157,218)",
  warning: "rgb(255,153,0)",
  error: "rgb(234,67,53)",
  info: "rgb(13,157,218)",
};

const LINEAR_GOOD: KitStyleColours = {
  bg: "#08090a",
  surface: "#131316",
  surfaceElevated: "#1a1a1e",
  text: "#f7f8f8",
  headingText: "#ffffff",
  textMuted: "rgba(255,255,255,0.55)",
  accent: "#5e6ad2",
  accentHover: "#6e7adf",
  accentSubtle: "rgba(94,106,210,0.12)",
  onAccent: "#ffffff",
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.22)",
  success: "#4cb782",
  warning: "#f2c94c",
  error: "#eb5757",
  info: "#5e6ad2",
};

// Brand-tinted surface that stays legible — must survive untouched.
const KLARNA_GOOD: KitStyleColours = {
  bg: "#ffffff",
  surface: "#ffa8cd",
  surfaceElevated: "#ffffff",
  text: "#17120f",
  headingText: "#0c0a09",
  textMuted: "#6b5d57",
  accent: "#000000",
  accentHover: "#1a1a1a",
  accentSubtle: "rgba(255,168,205,0.30)",
  onAccent: "#ffffff",
  border: "rgba(0,0,0,0.10)",
  borderStrong: "rgba(0,0,0,0.20)",
  success: "#0a8a3f",
  warning: "#d49a15",
  error: "#e54d2e",
  info: "#2383e2",
};

describe("repairProfileContrast", () => {
  it("repairs a light kit that shipped white text and a saturated surface", () => {
    const fixed = repairProfileContrast(DOVETAIL_BROKEN);
    // Text roles flipped to dark, legible on the light bg.
    expect(fixed.text).toBe("#1f2228");
    expect(fixed.headingText).toBe("#08090a");
    expect(fixed.textMuted).toBe("#6b7280");
    // Loud surfaces neutralised so dark text is readable on panels/nav.
    expect(fixed.surface).toBe("#fafafa");
    expect(fixed.surfaceElevated).toBe("#ffffff");
    // White-on-white borders fixed.
    expect(fixed.border).toBe("rgba(0, 0, 0, 0.10)");
    expect(fixed.borderStrong).toBe("rgba(0, 0, 0, 0.20)");
    // Brand accent is preserved — only the broken neutrals change.
    expect(fixed.accent).toBe("rgb(0, 68, 255)");
    expect(fixed.onAccent).toBe("rgb(255, 255, 255)");
  });

  it("leaves a well-formed dark palette untouched", () => {
    expect(repairProfileContrast(LINEAR_GOOD)).toEqual(LINEAR_GOOD);
  });

  it("preserves a legible brand-tinted surface (Klarna pink)", () => {
    expect(repairProfileContrast(KLARNA_GOOD)).toEqual(KLARNA_GOOD);
  });

  it("does not touch palettes whose bg is an unresolvable var()", () => {
    const withVarBg = { ...DOVETAIL_BROKEN, bg: "var(--bg-app)" };
    expect(repairProfileContrast(withVarBg)).toEqual(withVarBg);
  });

  it("is applied automatically by parseStyleProfile", () => {
    const parsed = parseStyleProfile({
      ...DEFAULT_STYLE_PROFILE,
      colours: DOVETAIL_BROKEN,
    });
    expect(parsed?.colours.text).toBe("#1f2228");
    expect(parsed?.colours.surface).toBe("#fafafa");
  });
});

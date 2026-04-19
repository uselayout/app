import { describe, it, expect } from "vitest";
import { isNoiseToken, partitionNoise } from "./noise";

describe("isNoiseToken", () => {
  it("drops well-known vendor prefixes", () => {
    expect(isNoiseToken("--fides-overlay-background-color", "#fff")).toBe(true);
    expect(isNoiseToken("--onetrust-banner-bg", "#000")).toBe(true);
    expect(isNoiseToken("--cookiebot-btn", "#111")).toBe(true);
    expect(isNoiseToken("--iubenda-cs-brand-color", "#abc")).toBe(true);
    expect(isNoiseToken("--hotjar-tooltip", "#eee")).toBe(true);
    expect(isNoiseToken("--intercom-messenger-bg", "#222")).toBe(true);
  });

  it("keeps legitimate design-system tokens", () => {
    expect(isNoiseToken("--accent", "#0a4b19")).toBe(false);
    expect(isNoiseToken("--color-primary", "#3366ff")).toBe(false);
    expect(isNoiseToken("--space-md", "16px")).toBe(false);
    expect(isNoiseToken("--font-size-lg", "18px")).toBe(false);
  });

  it("drops numeric-tint primitive names", () => {
    expect(isNoiseToken("--white-0", "#fff")).toBe(true);
    expect(isNoiseToken("--white-900", "#fff")).toBe(true);
    expect(isNoiseToken("--black-100", "#000")).toBe(true);
    expect(isNoiseToken("--gray-500", "#888")).toBe(true);
    expect(isNoiseToken("--neutral-200", "#ccc")).toBe(true);
  });

  it("does NOT drop semantic names that happen to have a numeric suffix", () => {
    expect(isNoiseToken("--accent-100", "#eee")).toBe(false);
    expect(isNoiseToken("--brand-primary-500", "#123")).toBe(false);
  });

  it("drops alpha-tint rgba(var(--x-rgb)) primitives", () => {
    expect(isNoiseToken("--text-muted", "rgba(var(--white-rgb),.5)")).toBe(true);
    expect(isNoiseToken("--overlay", "rgba(var(--black-rgb), 0.25)")).toBe(true);
    expect(isNoiseToken("--scrim", "rgba(var(--neutral-rgb), 0.6)")).toBe(true);
  });

  it("keeps rgba values that are not alpha-tint primitives", () => {
    expect(isNoiseToken("--accent", "rgba(10, 75, 25, 1)")).toBe(false);
    expect(isNoiseToken("--brand", "rgba(var(--brand-rgb), 0.5)")).toBe(false);
  });
});

describe("partitionNoise", () => {
  it("splits a mixed token list correctly", () => {
    const tokens = [
      { name: "--accent", value: "#0a4b19" },
      { name: "--fides-overlay-bg", value: "#fff" },
      { name: "--white-100", value: "#fff" },
      { name: "--space-md", value: "16px" },
      { name: "--overlay-50", value: "rgba(var(--black-rgb), 0.5)" },
    ];
    const { kept, dropped } = partitionNoise(tokens);
    expect(kept.map((t) => t.name)).toEqual(["--accent", "--space-md"]);
    expect(dropped.map((t) => t.name)).toEqual([
      "--fides-overlay-bg",
      "--white-100",
      "--overlay-50",
    ]);
  });

  it("returns empty arrays for empty input", () => {
    expect(partitionNoise([])).toEqual({ kept: [], dropped: [] });
  });
});

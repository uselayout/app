import { describe, expect, it } from "vitest";
import { isCuratedTokenName } from "./curated-filter";

describe("isCuratedTokenName", () => {
  it("accepts canonical colour tokens", () => {
    expect(isCuratedTokenName("--color-primary")).toBe(true);
    expect(isCuratedTokenName("--color-content-primary")).toBe(true);
    expect(isCuratedTokenName("--bg-surface")).toBe(true);
    expect(isCuratedTokenName("--text-body")).toBe(true);
    expect(isCuratedTokenName("--border-neutral")).toBe(true);
    expect(isCuratedTokenName("--ring-outline-color")).toBe(true);
  });

  it("accepts canonical typography tokens", () => {
    expect(isCuratedTokenName("--font-family-display")).toBe(true);
    expect(isCuratedTokenName("--font-size-md")).toBe(true);
    expect(isCuratedTokenName("--font-weight-bold")).toBe(true);
    expect(isCuratedTokenName("--line-height-tight")).toBe(true);
    expect(isCuratedTokenName("--letter-spacing-negative-md")).toBe(true);
  });

  it("accepts canonical spacing tokens with named slots", () => {
    expect(isCuratedTokenName("--space-xs")).toBe(true);
    expect(isCuratedTokenName("--space-md")).toBe(true);
    expect(isCuratedTokenName("--space-x-large")).toBe(true);
    expect(isCuratedTokenName("--padding-small")).toBe(true);
    expect(isCuratedTokenName("--size-small")).toBe(true);
    expect(isCuratedTokenName("--size-x-large")).toBe(true);
  });

  it("rejects pure-numeric size scales (--size-112, --font-size-48, etc.)", () => {
    expect(isCuratedTokenName("--size-112")).toBe(false);
    expect(isCuratedTokenName("--size-146")).toBe(false);
    expect(isCuratedTokenName("--size-160")).toBe(false);
    expect(isCuratedTokenName("--font-size-48")).toBe(false);
    expect(isCuratedTokenName("--space-126")).toBe(false);
  });

  it("rejects vendor / framework-scoped tokens", () => {
    expect(isCuratedTokenName("--mw-space-1")).toBe(false);
    expect(isCuratedTokenName("--eds-space-4")).toBe(false);
    expect(isCuratedTokenName("--fides-overlay-background")).toBe(false);
    expect(isCuratedTokenName("--chakra-color-red-500")).toBe(false);
    expect(isCuratedTokenName("--navigation-transition-timing-function")).toBe(false);
    expect(isCuratedTokenName("--coins-image")).toBe(false);
    expect(isCuratedTokenName("--coin-size")).toBe(false);
  });

  it("rejects component-scoped tokens (btn-, input-, card-, nav-)", () => {
    expect(isCuratedTokenName("--btn-radius-base")).toBe(false);
    expect(isCuratedTokenName("--input-padding")).toBe(false);
    expect(isCuratedTokenName("--card-border")).toBe(false);
    expect(isCuratedTokenName("--nav-height")).toBe(false);
  });

  it("accepts canonical motion tokens", () => {
    expect(isCuratedTokenName("--duration-fast")).toBe(true);
    expect(isCuratedTokenName("--ease-default")).toBe(true);
    expect(isCuratedTokenName("--transition-base")).toBe(true);
    expect(isCuratedTokenName("--motion-loaderStroke")).toBe(true);
  });

  it("accepts canonical shadow / effect tokens", () => {
    expect(isCuratedTokenName("--shadow-sm")).toBe(true);
    expect(isCuratedTokenName("--elevation-2")).toBe(true);
    expect(isCuratedTokenName("--opacity-disabled")).toBe(true);
  });

  it("accepts single-word brand-style names", () => {
    expect(isCuratedTokenName("--coral")).toBe(true);
    expect(isCuratedTokenName("--midnight")).toBe(true);
    expect(isCuratedTokenName("--ember")).toBe(true);
  });

  it("handles bare names without the -- prefix (census-mined shape)", () => {
    expect(isCuratedTokenName("color-accent")).toBe(true);
    expect(isCuratedTokenName("font-size-md")).toBe(true);
    expect(isCuratedTokenName("size-112")).toBe(false);
    expect(isCuratedTokenName("mw-space-1")).toBe(false);
  });
});

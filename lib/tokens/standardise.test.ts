import { describe, it, expect } from "vitest";
import { matchTokenToUnassignedRole } from "./standardise";
import type { ExtractedToken } from "@/lib/types";

function mkToken(overrides: Partial<ExtractedToken>): ExtractedToken {
  return {
    name: "primary",
    value: "#0a4b19",
    type: "color",
    category: "semantic",
    cssVariable: "--primary",
    ...overrides,
  };
}

describe("matchTokenToUnassignedRole", () => {
  it("returns null when the schema has no matching role for the token name", () => {
    const token = mkToken({ name: "random-unique-token-xyz", cssVariable: "--random-unique-token-xyz" });
    const match = matchTokenToUnassignedRole(token, {}, "layout", "high");
    expect(match).toBeNull();
  });

  it("matches a clearly-named accent token to the accent role with high confidence", () => {
    const token = mkToken({ name: "accent", cssVariable: "--accent", value: "#0a4b19" });
    const match = matchTokenToUnassignedRole(token, {}, "layout", "high");
    expect(match).not.toBeNull();
    expect(match!.roleKey).toBe("accent");
    expect(match!.confidence).toBe("high");
    expect(match!.standardName).toMatch(/^--layout-/);
  });

  it("skips a role that is already assigned", () => {
    const token = mkToken({ name: "accent", cssVariable: "--accent", value: "#0a4b19" });
    const existing = { accent: { roleKey: "accent" } };
    const match = matchTokenToUnassignedRole(token, existing, "layout", "high");
    expect(match).toBeNull();
  });

  it("matches a spacing token by name to space-md role", () => {
    const token = mkToken({
      name: "space-md",
      cssVariable: "--space-md",
      value: "12px",
      type: "spacing",
    });
    const match = matchTokenToUnassignedRole(token, {}, "layout", "high");
    expect(match).not.toBeNull();
    expect(match!.roleKey).toBe("space-md");
  });

  it("respects the minConfidence threshold", () => {
    // A token with a weak name match won't clear high-confidence but might clear low.
    const token = mkToken({ name: "background", cssVariable: "--background", value: "#fff" });
    const highOnly = matchTokenToUnassignedRole(token, {}, "layout", "high");
    const lowOk = matchTokenToUnassignedRole(token, {}, "layout", "low");
    // Either both succeed (if name scores high) or lowOk succeeds while highOnly may fail.
    expect(lowOk).not.toBeNull();
    if (highOnly) {
      expect(highOnly.confidence).toBe("high");
    }
  });
});

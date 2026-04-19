import { describe, it, expect } from "vitest";
import { dedupeTokensByValue } from "./dedupe";
import type { ExtractedToken } from "@/lib/types";

function mk(name: string, value: string, category: "primitive" | "semantic" = "semantic"): ExtractedToken {
  return {
    name: name.replace(/^--/, ""),
    value,
    type: "color",
    category,
    cssVariable: name,
  };
}

describe("dedupeTokensByValue", () => {
  it("returns the input unchanged when no duplicates", () => {
    const tokens = [mk("--accent", "#0a4b19"), mk("--surface", "#ffffff")];
    const out = dedupeTokensByValue(tokens);
    expect(out).toHaveLength(2);
  });

  it("collapses two tokens with the same colour value, keeping the more semantic name", () => {
    const tokens = [
      mk("--white-0", "#ffffff", "primitive"),
      mk("--surface", "#ffffff", "semantic"),
    ];
    const out = dedupeTokensByValue(tokens);
    expect(out).toHaveLength(1);
    expect(out[0].cssVariable).toBe("--surface");
    expect((out[0] as { aliases?: string[] }).aliases).toEqual(["--white-0"]);
  });

  it("treats #fff and #ffffff as the same value", () => {
    const tokens = [
      mk("--surface", "#fff"),
      mk("--canvas", "#ffffff"),
    ];
    const out = dedupeTokensByValue(tokens);
    expect(out).toHaveLength(1);
  });

  it("keeps tokens with different types but same value separate", () => {
    const radius: ExtractedToken = { name: "radius-md", value: "16px", type: "radius", category: "semantic", cssVariable: "--radius-md" };
    const space: ExtractedToken = { name: "space-lg", value: "16px", type: "spacing", category: "semantic", cssVariable: "--space-lg" };
    const out = dedupeTokensByValue([radius, space]);
    expect(out).toHaveLength(2);
  });

  it("keeps tokens with same value but different modes separate", () => {
    const light: ExtractedToken = { name: "accent", value: "#0a4b19", type: "color", category: "semantic", cssVariable: "--accent", mode: "light" };
    const dark: ExtractedToken = { name: "accent", value: "#0a4b19", type: "color", category: "semantic", cssVariable: "--accent", mode: "dark" };
    const out = dedupeTokensByValue([light, dark]);
    expect(out).toHaveLength(2);
  });

  it("prefers semantic category over primitive even with equal hints", () => {
    const prim = mk("--red-500", "#ef4444", "primitive");
    const sem = mk("--accent", "#ef4444", "semantic");
    const out = dedupeTokensByValue([prim, sem]);
    expect(out[0].cssVariable).toBe("--accent");
  });

  it("gathers multiple aliases on the kept token", () => {
    const tokens = [
      mk("--accent", "#0a4b19", "semantic"),
      mk("--brand-green", "#0a4b19", "primitive"),
      mk("--green-700", "#0a4b19", "primitive"),
    ];
    const out = dedupeTokensByValue(tokens);
    expect(out).toHaveLength(1);
    const aliases = (out[0] as { aliases?: string[] }).aliases ?? [];
    expect(aliases.length).toBe(2);
    expect(aliases).toContain("--brand-green");
    expect(aliases).toContain("--green-700");
  });
});

import { describe, it, expect } from "vitest";
import { resolveTokenAlias } from "./resolve-alias";
import type { ExtractedToken } from "@/lib/types";

function mk(name: string, value: string, reference?: string): ExtractedToken {
  return {
    name: name.replace(/^--/, ""),
    value,
    type: "color",
    category: name.startsWith("--primitive") ? "primitive" : "semantic",
    cssVariable: name,
    ...(reference ? { reference } : {}),
  };
}

describe("resolveTokenAlias", () => {
  it("returns the concrete value when a token has no reference", () => {
    const t = mk("--primitive-red-400", "#ef4444");
    const out = resolveTokenAlias(t, [t]);
    expect(out.resolvedValue).toBe("#ef4444");
    expect(out.isAlias).toBe(false);
    expect(out.chain).toEqual(["--primitive-red-400"]);
  });

  it("follows a single-hop alias via the reference field", () => {
    const primitive = mk("--primitive-red-400", "#ef4444");
    const semantic = mk("--accent", "#ef4444", "var(--primitive-red-400)");
    const out = resolveTokenAlias(semantic, [primitive, semantic]);
    expect(out.resolvedValue).toBe("#ef4444");
    expect(out.isAlias).toBe(true);
    expect(out.chain).toEqual(["--accent", "--primitive-red-400"]);
  });

  it("follows multi-hop alias chains", () => {
    const primitive = mk("--primitive-red-400", "#ef4444");
    const semantic = mk("--brand-red", "#ef4444", "var(--primitive-red-400)");
    const component = mk("--button-bg", "#ef4444", "var(--brand-red)");
    const out = resolveTokenAlias(component, [primitive, semantic, component]);
    expect(out.resolvedValue).toBe("#ef4444");
    expect(out.chain).toEqual(["--button-bg", "--brand-red", "--primitive-red-400"]);
  });

  it("falls back to parsing var() from the value when reference is absent", () => {
    const primitive = mk("--primitive-red-400", "#ef4444");
    const aliasViaValue: ExtractedToken = {
      ...mk("--accent", "var(--primitive-red-400)"),
    };
    const out = resolveTokenAlias(aliasViaValue, [primitive, aliasViaValue]);
    expect(out.resolvedValue).toBe("#ef4444");
    expect(out.isAlias).toBe(true);
  });

  it("marks cycles as partial without infinite looping", () => {
    const a = mk("--a", "val", "var(--b)");
    const b = mk("--b", "val", "var(--a)");
    const out = resolveTokenAlias(a, [a, b]);
    expect(out.partial).toBe(true);
    expect(out.chain.length).toBeGreaterThanOrEqual(2);
  });

  it("marks unresolvable targets as partial", () => {
    const orphan = mk("--orphan", "val", "var(--missing)");
    const out = resolveTokenAlias(orphan, [orphan]);
    expect(out.partial).toBe(true);
    expect(out.chain).toEqual(["--orphan", "--missing"]);
  });
});

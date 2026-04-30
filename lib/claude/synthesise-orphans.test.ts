import { describe, expect, it } from "vitest";
import { pickSaturatedOrphanColours } from "./synthesise";

type Unassigned = Parameters<typeof pickSaturatedOrphanColours>[0];

function token(value: string, opts: Partial<{ name: string; cssVariable: string; hidden: boolean; type: string }> = {}): Unassigned[number] {
  return {
    name: opts.name ?? `t-${value}`,
    cssVariable: opts.cssVariable,
    value,
    type: opts.type ?? "color",
    hidden: opts.hidden ?? false,
  };
}

describe("pickSaturatedOrphanColours", () => {
  it("returns an empty list when nothing qualifies", () => {
    const unassigned: Unassigned = [
      token("#ffffff"),
      token("#000000"),
      token("#888888"),
    ];
    expect(pickSaturatedOrphanColours(unassigned)).toEqual([]);
  });

  it("surfaces the Headspace pink + purple when they are unassigned", () => {
    const unassigned: Unassigned = [
      token("#FF80AB", { name: "pink", cssVariable: "--pink" }),
      token("#7B57D3", { name: "purple", cssVariable: "--purple" }),
      token("#ffffff"),
      token("#1c1b1f"),
    ];
    const out = pickSaturatedOrphanColours(unassigned);
    const values = out.map((t) => t.value);
    expect(values).toContain("#FF80AB");
    expect(values).toContain("#7B57D3");
    expect(values).not.toContain("#ffffff");
    expect(values).not.toContain("#1c1b1f");
  });

  it("ignores hidden tokens", () => {
    const unassigned: Unassigned = [
      token("#FF80AB", { hidden: true }),
      token("#7B57D3"),
    ];
    const out = pickSaturatedOrphanColours(unassigned);
    expect(out.map((t) => t.value)).toEqual(["#7B57D3"]);
  });

  it("ignores non-colour tokens", () => {
    const unassigned: Unassigned = [
      token("16px", { type: "spacing" }),
      token("#FF80AB"),
    ];
    const out = pickSaturatedOrphanColours(unassigned);
    expect(out.map((t) => t.value)).toEqual(["#FF80AB"]);
  });

  it("collapses near-duplicate hues to one slot", () => {
    const unassigned: Unassigned = [
      token("#FFCE00"),  // yellow, hue ~48°
      token("#FFD500"),  // near-duplicate yellow
      token("#FF80AB"),  // pink, distinct
    ];
    const out = pickSaturatedOrphanColours(unassigned);
    expect(out).toHaveLength(2);
  });

  it("respects the max cap", () => {
    const unassigned: Unassigned = [
      token("#FFCE00"),   // yellow
      token("#FF80AB"),   // pink
      token("#7B57D3"),   // purple
      token("#50C878"),   // green
      token("#00A2DD"),   // blue
    ];
    const out = pickSaturatedOrphanColours(unassigned, 2);
    expect(out).toHaveLength(2);
  });

  it("parses both hex and rgb() colour values", () => {
    const unassigned: Unassigned = [
      token("rgb(255, 128, 171)"),
      token("rgba(123, 87, 211, 1)"),
    ];
    const out = pickSaturatedOrphanColours(unassigned);
    expect(out).toHaveLength(2);
  });
});

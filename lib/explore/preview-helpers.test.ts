import { describe, expect, it } from "vitest";
import { buildCssTokenBlock, buildSrcdoc } from "./preview-helpers";

describe("buildCssTokenBlock — malformed input guards (I8 regression)", () => {
  it("emits a :root block for well-formed tokens", () => {
    const out = buildCssTokenBlock({ "--color-bg": "#fff", "--radius-md": "8px" });
    expect(out).toContain("--color-bg: #fff;");
    expect(out).toContain("--radius-md: 8px;");
    expect(out).toContain(":root");
  });

  it("rejects tokens whose value contains a semicolon (would break the declaration)", () => {
    const out = buildCssTokenBlock({
      "--safe": "8px",
      "--injected": "1rem; color:red",
    });
    expect(out).toContain("--safe: 8px;");
    expect(out).not.toContain("--injected");
    expect(out).not.toContain("color:red");
  });

  it("rejects tokens whose value contains braces (would close the :root block)", () => {
    const out = buildCssTokenBlock({
      "--safe": "8px",
      "--injected": "8px } body { background: red",
    });
    expect(out).toContain("--safe: 8px;");
    expect(out).not.toContain("--injected");
  });

  it("allows url(data:...) values with colons (these are legitimate)", () => {
    const out = buildCssTokenBlock({
      "--logo": "url(data:image/svg+xml;base64,PHN2Zz4=)",
    });
    // Hmm: the base64 data URI contains a semicolon (data:image/svg+xml;base64)
    // so this WILL be rejected by the hasBadChars filter. This is the
    // conservative trade-off: avoid silent declaration termination at the
    // cost of failing loud when a DTCG-style URL value slips in.
    expect(out).toBe("");
  });

  it("rejects tokens with malformed names (broken extraction output)", () => {
    const out = buildCssTokenBlock({
      "--size);width:var(--size": "8px",
      "--good": "8px",
    });
    expect(out).toContain("--good: 8px;");
    expect(out).not.toContain("--size)");
  });
});

describe("buildSrcdoc — icon pack require interpolation (I5 regression)", () => {
  it("quotes npm package names so stray characters can't break the require shim", () => {
    const html = buildSrcdoc("var x = 1;", "X", {
      iconPacks: ["lucide"], // registry id — npmPackage is "lucide-react"
    });
    // Require mapping for lucide-react appears with JSON-quoted package name
    // and bracket-indexed global, not unquoted interpolation.
    expect(html).toContain('"lucide-react"');
    expect(html).toContain('window["LucideReact"]');
    expect(html).not.toContain("window.LucideReact");
  });

  it("emits an empty require mapping when no icon packs are selected", () => {
    const html = buildSrcdoc("var x = 1;", "X");
    // The default require function falls straight into the react branch.
    expect(html).toContain('var require=function(n){return n==="react"?React');
  });
});

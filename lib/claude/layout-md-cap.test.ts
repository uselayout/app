import { describe, it, expect } from "vitest";
import { capQuickReferenceInLayoutMd } from "./layout-md-cap";

function withQR(qrBody: string): string {
  return [
    "## 0. Quick Reference",
    qrBody,
    "## 1. Design Direction & Philosophy",
    "Body of section 1.",
    "",
  ].join("\n");
}

describe("capQuickReferenceInLayoutMd", () => {
  it("leaves markdown unchanged when Quick Reference is under the cap", () => {
    const md = withQR(Array.from({ length: 30 }, (_, i) => `line ${i}`).join("\n"));
    expect(capQuickReferenceInLayoutMd(md, 75)).toBe(md);
  });

  it("trims Quick Reference that exceeds the cap and adds a notice", () => {
    const lines = Array.from({ length: 120 }, (_, i) => `line ${i}`).join("\n");
    const md = withQR(lines);
    const out = capQuickReferenceInLayoutMd(md, 75);
    expect(out).toContain("## 0. Quick Reference");
    expect(out).toContain("## 1. Design Direction");
    expect(out).toContain("truncated to fit the 75-line cap");
    expect(out).toContain("line 0");
    // Lines from 75 onwards should be gone. "line 80" is a specific oversize marker.
    expect(out).not.toContain("line 119");
  });

  it("snaps the trim back to the last closing fence when it would split a code block", () => {
    const qr = [
      "Some text.",
      "",
      "```css",
      ...Array.from({ length: 100 }, (_, i) => `  --var-${i}: 0;`),
      "```",
      "",
      "trailing text",
    ].join("\n");
    const md = withQR(qr);
    const out = capQuickReferenceInLayoutMd(md, 75);
    // The output Quick Reference must not contain an unclosed fence.
    const qrSlice = out.slice(out.indexOf("## 0."), out.indexOf("## 1."));
    const fenceCount = (qrSlice.match(/^```/gm) ?? []).length;
    expect(fenceCount % 2).toBe(0);
  });

  it("returns the original markdown when no Quick Reference heading exists", () => {
    const md = "# Untitled\n\nSome body text without a Quick Reference section.\n";
    expect(capQuickReferenceInLayoutMd(md, 75)).toBe(md);
  });
});

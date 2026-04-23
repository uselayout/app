import { describe, expect, it } from "vitest";
import { renderCoreTokensBlock } from "./derive";
import type { ProjectStandardisation } from "@/lib/types";

const standardisation = (overrides: Partial<ProjectStandardisation["assignments"]> = {}): ProjectStandardisation => ({
  kitPrefix: "color",
  assignments: overrides as ProjectStandardisation["assignments"],
  unassigned: [],
  antiPatterns: [],
  dismissedAntiPatterns: [],
  standardisedAt: "2026-04-20T00:00:00.000Z",
});

describe("renderCoreTokensBlock — multi-mode (Phase 3.5)", () => {
  it("emits default assignments inside :root when no mode variants exist", () => {
    const out = renderCoreTokensBlock(
      standardisation({
        "bg-app": {
          roleKey: "bg-app",
          originalName: "white",
          value: "#ffffff",
          standardName: "--color-bg-app",
          confidence: "high",
          userConfirmed: true,
        },
      })
    );
    expect(out).toContain(":root {");
    expect(out).toContain("--color-bg-app: #ffffff;");
    expect(out).not.toContain("[data-theme=");
  });

  it("partitions light and dark assignments into separate selector blocks", () => {
    const out = renderCoreTokensBlock(
      standardisation({
        "bg-app": {
          roleKey: "bg-app",
          originalName: "white",
          value: "#ffffff",
          standardName: "--color-bg-app",
          confidence: "high",
          userConfirmed: true,
        },
        "bg-app::dark": {
          roleKey: "bg-app",
          mode: "dark",
          originalName: "black",
          value: "#000000",
          standardName: "--color-bg-app",
          confidence: "high",
          userConfirmed: true,
        },
      })
    );
    expect(out).toContain(":root {");
    expect(out).toContain("--color-bg-app: #ffffff;");
    expect(out).toContain('[data-theme="dark"] {');
    expect(out).toContain("--color-bg-app: #000000;");
    // Light and dark values both present in the block — light before dark.
    expect(out.indexOf("#ffffff")).toBeLessThan(out.indexOf("#000000"));
  });

  it("emits a prefers-color-scheme: dark twin for the dark mode", () => {
    const out = renderCoreTokensBlock(
      standardisation({
        "bg-app::dark": {
          roleKey: "bg-app",
          mode: "dark",
          originalName: "black",
          value: "#000000",
          standardName: "--color-bg-app",
          confidence: "high",
          userConfirmed: true,
        },
      })
    );
    expect(out).toContain("@media (prefers-color-scheme: dark)");
    // Two declarations of the same var — one inside the selector block,
    // one inside the media query.
    const darkDecls = out.match(/--color-bg-app: #000000;/g) ?? [];
    expect(darkDecls.length).toBe(2);
  });

  it("does not emit a prefers-color-scheme twin for non-standard modes", () => {
    const out = renderCoreTokensBlock(
      standardisation({
        "bg-app::high-contrast": {
          roleKey: "bg-app",
          mode: "high-contrast",
          originalName: "solid-black",
          value: "#000000",
          standardName: "--color-bg-app",
          confidence: "high",
          userConfirmed: true,
        },
      })
    );
    expect(out).toContain('[data-theme="high-contrast"]');
    expect(out).not.toContain("prefers-color-scheme");
  });

  it("sorts non-default modes alphabetically so re-derives are deterministic", () => {
    const out = renderCoreTokensBlock(
      standardisation({
        "bg-app::zebra": {
          roleKey: "bg-app",
          mode: "zebra",
          originalName: "b",
          value: "#111",
          standardName: "--color-bg-app",
          confidence: "high",
          userConfirmed: true,
        },
        "bg-app::alpha": {
          roleKey: "bg-app",
          mode: "alpha",
          originalName: "a",
          value: "#222",
          standardName: "--color-bg-app",
          confidence: "high",
          userConfirmed: true,
        },
      })
    );
    const alphaIdx = out.indexOf("alpha");
    const zebraIdx = out.indexOf("zebra");
    expect(alphaIdx).toBeGreaterThan(-1);
    expect(zebraIdx).toBeGreaterThan(-1);
    expect(alphaIdx).toBeLessThan(zebraIdx);
  });
});

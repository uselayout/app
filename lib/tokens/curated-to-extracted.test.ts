import { describe, it, expect } from "vitest";
import { buildCuratedExtractedTokens } from "./curated-to-extracted";
import type { ProjectStandardisation } from "@/lib/types";

function mkStandardisation(
  assignments: ProjectStandardisation["assignments"]
): ProjectStandardisation {
  return {
    kitPrefix: "test",
    assignments,
    unassigned: [],
    antiPatterns: [],
    standardisedAt: "2026-04-17T00:00:00Z",
  };
}

describe("buildCuratedExtractedTokens", () => {
  it("returns null when standardisation is missing", () => {
    expect(buildCuratedExtractedTokens(undefined)).toBeNull();
  });

  it("returns null when there are no assignments", () => {
    expect(buildCuratedExtractedTokens(mkStandardisation({}))).toBeNull();
  });

  it("routes colour roles (bg/text/border/accent/status) into colors bucket", () => {
    const out = buildCuratedExtractedTokens(
      mkStandardisation({
        "bg-app": {
          roleKey: "bg-app",
          originalName: "background",
          value: "#fff",
          standardName: "--test-bg-app",
          confidence: "high",
          userConfirmed: true,
        },
        "text-primary": {
          roleKey: "text-primary",
          originalName: "textPrimary",
          value: "#111",
          standardName: "--test-text-primary",
          confidence: "high",
          userConfirmed: true,
        },
        "accent": {
          roleKey: "accent",
          originalName: "brand",
          value: "#0a4b19",
          standardName: "--test-accent",
          confidence: "high",
          userConfirmed: true,
        },
        "error": {
          roleKey: "error",
          originalName: "errorRed",
          value: "#b3261e",
          standardName: "--test-error",
          confidence: "medium",
          userConfirmed: false,
        },
      })
    );
    expect(out).not.toBeNull();
    expect(out!.colors.length).toBe(4);
    expect(out!.typography.length).toBe(0);
    const accent = out!.colors.find((t) => t.standardRole === "accent");
    expect(accent?.cssVariable).toBe("--test-accent");
    expect(accent?.standardConfidence).toBe("high");
    expect(accent?.category).toBe("semantic");
  });

  it("routes typography, spacing, radius, shadow, motion into their buckets", () => {
    const out = buildCuratedExtractedTokens(
      mkStandardisation({
        "space-md": {
          roleKey: "space-md",
          originalName: "space-3",
          value: "12px",
          standardName: "--test-space-md",
          confidence: "high",
          userConfirmed: true,
        },
        "radius-md": {
          roleKey: "radius-md",
          originalName: "radius",
          value: "8px",
          standardName: "--test-radius-md",
          confidence: "high",
          userConfirmed: true,
        },
        "shadow-sm": {
          roleKey: "shadow-sm",
          originalName: "elevation-1",
          value: "0 1px 2px rgba(0,0,0,0.1)",
          standardName: "--test-shadow-sm",
          confidence: "medium",
          userConfirmed: false,
        },
        "duration-fast": {
          roleKey: "duration-fast",
          originalName: "fast",
          value: "120ms",
          standardName: "--test-duration-fast",
          confidence: "low",
          userConfirmed: false,
        },
      })
    );
    expect(out!.spacing.length).toBe(1);
    expect(out!.spacing[0].value).toBe("12px");
    expect(out!.radius.length).toBe(1);
    expect(out!.effects.length).toBe(1);
    expect(out!.motion.length).toBe(1);
  });

  it("silently skips unknown role keys", () => {
    const out = buildCuratedExtractedTokens(
      mkStandardisation({
        "bogus-role": {
          roleKey: "bogus-role",
          originalName: "nope",
          value: "nope",
          standardName: "--test-bogus",
          confidence: "low",
          userConfirmed: false,
        },
      })
    );
    expect(out).toBeNull();
  });
});

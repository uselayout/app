import { describe, expect, it } from "vitest";
import { preserveUserCuration } from "./use-extraction";
import type { ProjectStandardisation } from "@/lib/types";

function assignment(
  roleKey: string,
  name: string,
  value: string,
  userConfirmed: boolean,
): ProjectStandardisation["assignments"][string] {
  return {
    roleKey,
    originalName: name,
    originalCssVariable: `--${name}`,
    value,
    standardName: `--kit-${roleKey}`,
    confidence: "high",
    userConfirmed,
  };
}

function std(
  assignments: Record<string, ProjectStandardisation["assignments"][string]>,
  unassigned: ProjectStandardisation["unassigned"] = [],
  dismissedAntiPatterns?: string[],
): ProjectStandardisation {
  return {
    kitPrefix: "kit",
    assignments,
    unassigned,
    antiPatterns: [],
    dismissedAntiPatterns,
    standardisedAt: "2026-04-22T00:00:00.000Z",
  };
}

describe("preserveUserCuration — user edits survive re-extraction", () => {
  it("keeps user-confirmed assignments and overwrites auto ones for the same role", () => {
    const previous = std({
      accent: assignment("accent", "brand-green", "#00ff00", true),
      "bg-app": assignment("bg-app", "auto-white", "#ffffff", false),
    });

    const fresh = std({
      accent: assignment("accent", "auto-blue", "#0000ff", false),
      "bg-app": assignment("bg-app", "new-white", "#fafafa", false),
    });

    const merged = preserveUserCuration(fresh, previous);

    expect(merged.assignments.accent.originalName).toBe("brand-green");
    expect(merged.assignments.accent.userConfirmed).toBe(true);
    expect(merged.assignments["bg-app"].originalName).toBe("new-white");
    expect(merged.assignments["bg-app"].userConfirmed).toBe(false);
  });

  it("does nothing when there is no previous standardisation", () => {
    const fresh = std({ accent: assignment("accent", "auto-blue", "#0000ff", false) });
    expect(preserveUserCuration(fresh, undefined)).toBe(fresh);
  });

  it("does nothing when previous has no user-confirmed assignments", () => {
    const previous = std({ accent: assignment("accent", "old-blue", "#0000ff", false) });
    const fresh = std({ accent: assignment("accent", "new-blue", "#0033ff", false) });

    const merged = preserveUserCuration(fresh, previous);
    expect(merged.assignments.accent.originalName).toBe("new-blue");
  });

  it("removes a token from `unassigned` when the user has curated it elsewhere", () => {
    const previous = std({
      accent: assignment("accent", "brand-green", "#00ff00", true),
    });
    const fresh = std(
      {
        accent: assignment("accent", "auto-blue", "#0000ff", false),
      },
      [
        { name: "brand-green", cssVariable: "--brand-green", value: "#00ff00", type: "color", hidden: false },
        { name: "unused-purple", cssVariable: "--unused-purple", value: "#800080", type: "color", hidden: false },
      ],
    );

    const merged = preserveUserCuration(fresh, previous);

    const unassignedNames = merged.unassigned.map((u) => u.name);
    expect(unassignedNames).not.toContain("brand-green");
    expect(unassignedNames).toContain("unused-purple");
  });

  it("preserves dismissedAntiPatterns from the previous run", () => {
    const previous = std({}, [], ["no-inline-styles", "no-hardcoded-hex"]);
    const fresh = std({}, []);

    const merged = preserveUserCuration(fresh, previous);
    expect(merged.dismissedAntiPatterns).toEqual(["no-inline-styles", "no-hardcoded-hex"]);
  });

  it("keeps a user-curated role even when the role disappears from auto output (e.g. source lost the token)", () => {
    const previous = std({
      "accent-hover": assignment("accent-hover", "brand-green-dark", "#00aa00", true),
    });
    const fresh = std({ accent: assignment("accent", "auto-blue", "#0000ff", false) });

    const merged = preserveUserCuration(fresh, previous);

    // Accent from fresh, accent-hover revived from previous user choice.
    expect(merged.assignments.accent.originalName).toBe("auto-blue");
    expect(merged.assignments["accent-hover"].originalName).toBe("brand-green-dark");
    expect(merged.assignments["accent-hover"].userConfirmed).toBe(true);
  });
});

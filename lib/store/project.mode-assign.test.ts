import { describe, expect, it } from "vitest";
import { useProjectStore } from "./project";
import { assignmentKey } from "@/lib/tokens/assignment-key";
import type { Project } from "@/lib/types";

function baseProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "p-mode-test",
    orgId: "org-test",
    name: "Mode Test",
    sourceType: "figma",
    layoutMd: "",
    extractionData: {
      tokens: { colors: [], typography: [], spacing: [], radius: [], effects: [], motion: [] },
      cssVariables: {},
      sourceType: "figma",
    },
    standardisation: {
      kitPrefix: "kit",
      assignments: {},
      unassigned: [],
      antiPatterns: [],
      dismissedAntiPatterns: [],
      standardisedAt: "2026-04-20T00:00:00.000Z",
    },
    createdAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    ...overrides,
  } as Project;
}

describe("store mode-aware assignments (Phase 3.5 UI path)", () => {
  it("assignTokenToRole with a mode writes to the compound key", () => {
    const store = useProjectStore.getState();
    store.clearProjects();
    store.loadProjects([baseProject()], "u1", "org-test");

    store.assignTokenToRole(
      "p-mode-test",
      "bg-app",
      "black",
      "--black",
      "#000000",
      "--kit-bg-app",
      "dark"
    );

    const project = useProjectStore.getState().projects.find((p) => p.id === "p-mode-test");
    expect(project?.standardisation?.assignments).toBeDefined();
    const key = assignmentKey("bg-app", "dark");
    expect(project!.standardisation!.assignments[key]).toBeDefined();
    expect(project!.standardisation!.assignments[key].mode).toBe("dark");
    expect(project!.standardisation!.assignments[key].value).toBe("#000000");
    // Light slot for the same role stays empty
    expect(project!.standardisation!.assignments["bg-app"]).toBeUndefined();
  });

  it("addToken({ assignToRole: { ..., mode } }) creates token + mode-scoped assignment", () => {
    const store = useProjectStore.getState();
    store.clearProjects();
    store.loadProjects([baseProject()], "u1", "org-test");

    store.addToken(
      "p-mode-test",
      {
        name: "bg-dark-custom",
        value: "#0b0b0c",
        type: "color",
        category: "semantic",
        cssVariable: "--bg-dark-custom",
        mode: "dark",
      },
      { assignToRole: { roleKey: "bg-surface", standardName: "--kit-bg-surface", mode: "dark" } }
    );

    const project = useProjectStore.getState().projects.find((p) => p.id === "p-mode-test");
    const key = assignmentKey("bg-surface", "dark");
    expect(project!.standardisation!.assignments[key]).toBeDefined();
    expect(project!.standardisation!.assignments[key].mode).toBe("dark");
    // Token landed in extractionData too
    expect(
      project!.extractionData!.tokens.colors.some((t) => t.name === "bg-dark-custom")
    ).toBe(true);
  });

  it("unassignRole with a mode drops only the mode-scoped assignment, keeping the light slot", () => {
    const store = useProjectStore.getState();
    store.clearProjects();
    store.loadProjects([baseProject()], "u1", "org-test");

    // Assign both light and dark for the same role
    store.assignTokenToRole(
      "p-mode-test",
      "text-primary",
      "offblack",
      "--offblack",
      "#111",
      "--kit-text-primary"
    );
    store.assignTokenToRole(
      "p-mode-test",
      "text-primary",
      "paper-white",
      "--paper-white",
      "#fafafa",
      "--kit-text-primary",
      "dark"
    );

    store.unassignRole("p-mode-test", "text-primary", "dark");

    const project = useProjectStore.getState().projects.find((p) => p.id === "p-mode-test");
    expect(project!.standardisation!.assignments["text-primary"]).toBeDefined();
    expect(project!.standardisation!.assignments[assignmentKey("text-primary", "dark")]).toBeUndefined();
  });
});

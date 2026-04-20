import { describe, expect, it } from "vitest";
import { projectToRow, rowToProject } from "./db";
import type { Project } from "@/lib/types";

// Project fields not under test (storage-only, opaque JSON, or dedicated endpoint
// only) don't need realistic values — a cast is fine.
function baseProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "p1",
    orgId: "org1",
    name: "Test",
    sourceType: "figma",
    layoutMd: "# layout",
    createdAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    ...overrides,
  } as Project;
}

function baseRow(extraction_data: unknown) {
  return {
    id: "p1",
    org_id: "org1",
    name: "Test",
    source_type: "figma",
    source_url: null,
    layout_md: "# layout",
    extraction_data,
    token_count: null,
    health_score: null,
    test_results: null,
    explorations: null,
    pending_canvas_image: null,
    scanned_components: null,
    scan_source: null,
    last_scan_at: null,
    github_repo: null,
    branding_assets: null,
    context_documents: null,
    snapshots: null,
    user_id: "u1",
    created_at: "2026-04-20T00:00:00.000Z",
    updated_at: "2026-04-20T00:00:00.000Z",
  };
}

describe("piggy-backed fields round-trip symmetrically", () => {
  it("iconPacks survives projectToRow → rowToProject (regression: B5)", () => {
    const input = baseProject({ iconPacks: ["lucide", "simple-icons"] });
    const row = projectToRow(input, "u1");
    const back = rowToProject({ ...baseRow(row.extraction_data), updated_at: row.updated_at });
    expect(back.iconPacks).toEqual(["lucide", "simple-icons"]);
  });

  it("pluginTokensPushedAt survives both directions (regression: B7)", () => {
    const input = baseProject({ pluginTokensPushedAt: "2026-04-20T12:00:00.000Z" });
    const row = projectToRow(input, "u1");
    const back = rowToProject({ ...baseRow(row.extraction_data), updated_at: row.updated_at });
    expect(back.pluginTokensPushedAt).toBe("2026-04-20T12:00:00.000Z");
  });

  it("all four piggy-backed fields coexist without interfering", () => {
    const input = baseProject({
      iconPacks: ["lucide"],
      pluginTokensPushedAt: "2026-04-20T12:00:00.000Z",
      uploadedFonts: [{ family: "Inter", url: "data:font/x" } as never],
      standardisation: {
        kitPrefix: "color",
        assignments: {},
        unassigned: [],
        antiPatterns: [],
        dismissedAntiPatterns: [],
        standardisedAt: "2026-04-20T00:00:00.000Z",
      },
    });
    const row = projectToRow(input, "u1");
    const back = rowToProject({ ...baseRow(row.extraction_data), updated_at: row.updated_at });

    expect(back.iconPacks).toEqual(["lucide"]);
    expect(back.pluginTokensPushedAt).toBe("2026-04-20T12:00:00.000Z");
    expect(back.uploadedFonts?.[0]?.family).toBe("Inter");
    expect(back.standardisation?.kitPrefix).toBe("color");
  });

  it("a project with no piggy-backed fields and no extraction data writes null extraction_data", () => {
    const input = baseProject();
    const row = projectToRow(input, "u1");
    expect(row.extraction_data).toBeNull();
  });

  it("a project with only iconPacks (no extraction data) still persists them", () => {
    const input = baseProject({ iconPacks: ["lucide"] });
    const row = projectToRow(input, "u1");
    const data = row.extraction_data as Record<string, unknown> | null;
    expect(data).not.toBeNull();
    expect(data?._iconPacks).toEqual(["lucide"]);
    const back = rowToProject({ ...baseRow(data), snapshots: null, updated_at: row.updated_at });
    expect(back.iconPacks).toEqual(["lucide"]);
    expect(back.extractionData).toBeUndefined();
  });
});

describe("snapshots persistence via dedicated column (regression: B6)", () => {
  it("projectToRow writes snapshots into the column (not extraction_data)", () => {
    const snapshot = {
      id: "s1",
      label: "before curate",
      tokens: { colors: [], typography: [], spacing: [], radius: [], effects: [] },
      layoutMd: "# old",
      tokenCount: 0,
      createdAt: "2026-04-20T00:00:00.000Z",
    };
    const row = projectToRow(baseProject({ snapshots: [snapshot as never] }), "u1");
    expect(row.snapshots).toEqual([snapshot]);
    // Snapshots MUST NOT piggy-back into extraction_data — they'd bloat that
    // payload and blow the 5MB save limit with a few captures.
    const data = row.extraction_data as Record<string, unknown> | null;
    expect(data).toBeNull();
  });

  it("rowToProject surfaces the snapshots column", () => {
    const snapshot = {
      id: "s1",
      label: "before curate",
      tokens: { colors: [], typography: [], spacing: [], radius: [], effects: [] },
      layoutMd: "# old",
      tokenCount: 0,
      createdAt: "2026-04-20T00:00:00.000Z",
    };
    const back = rowToProject({ ...baseRow(null), snapshots: [snapshot] });
    expect(back.snapshots).toEqual([snapshot]);
  });

  it("round-trips an empty snapshots array as undefined on the way back", () => {
    const row = projectToRow(baseProject(), "u1");
    expect(row.snapshots).toBeNull();
    const back = rowToProject({ ...baseRow(null), snapshots: null });
    expect(back.snapshots).toBeUndefined();
  });
});

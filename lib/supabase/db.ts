import { supabase } from "./client";
import { deleteScreenshots } from "./storage";
import type { Project } from "@/lib/types";

interface ProjectRow {
  id: string;
  org_id: string;
  name: string;
  source_type: string;
  source_url: string | null;
  layout_md: string;
  extraction_data: unknown | null;
  token_count: number | null;
  health_score: number | null;
  test_results: unknown | null;
  explorations: unknown | null;
  pending_canvas_image: string | null;
  scanned_components: unknown | null;
  scan_source: string | null;
  last_scan_at: string | null;
  github_repo: string | null;
  branding_assets: unknown | null;
  context_documents: unknown | null;
  snapshots: unknown | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Exported for round-trip tests in db.test.ts. Piggy-backed fields in
// extraction_data (_uploadedFonts, _standardisation, _pluginTokensPushedAt,
// _iconPacks) have silently dropped user data in the past when one direction
// was updated without the other; tests exercise both paths in lockstep.
export function rowToProject(row: ProjectRow): Project {
  // Extract piggy-backed fields from extraction_data before casting
  const rawExtraction = row.extraction_data as Record<string, unknown> | null;
  const uploadedFonts = (rawExtraction?._uploadedFonts as Project["uploadedFonts"]) ?? undefined;
  const standardisation = (rawExtraction?._standardisation as Project["standardisation"]) ?? undefined;
  const pluginTokensPushedAt = (rawExtraction?._pluginTokensPushedAt as string) ?? undefined;
  const iconPacks = (rawExtraction?._iconPacks as string[]) ?? undefined;
  const layoutMdAuthored = (rawExtraction?._layoutMdAuthored as string) ?? undefined;

  // Strip piggy-backed fields from extraction data before casting to ExtractionResult
  let extractionData: Project["extractionData"] | undefined;
  if (rawExtraction) {
    const {
      _uploadedFonts: _,
      _standardisation: __,
      _pluginTokensPushedAt: ___,
      _iconPacks: ____,
      _layoutMdAuthored: _____,
      ...clean
    } = rawExtraction;
    // Only treat as real extraction data if it has actual extraction fields
    extractionData = clean.sourceType ? (clean as unknown as Project["extractionData"]) : undefined;
  }

  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    sourceType: row.source_type as Project["sourceType"],
    sourceUrl: row.source_url ?? undefined,
    layoutMd: row.layout_md,
    extractionData,
    uploadedFonts,
    standardisation,
    tokenCount: row.token_count ?? undefined,
    healthScore: row.health_score ?? undefined,
    explorations: row.explorations
      ? (row.explorations as Project["explorations"])
      : undefined,
    pendingCanvasImage: row.pending_canvas_image ?? null,
    scannedComponents: row.scanned_components
      ? (row.scanned_components as Project["scannedComponents"])
      : undefined,
    scanSource: (row.scan_source as Project["scanSource"]) ?? undefined,
    lastScanAt: (row.last_scan_at as string) ?? undefined,
    githubRepo: (row.github_repo as string) ?? undefined,
    brandingAssets: row.branding_assets
      ? (row.branding_assets as Project["brandingAssets"])
      : undefined,
    contextDocuments: row.context_documents
      ? (row.context_documents as Project["contextDocuments"])
      : undefined,
    snapshots: row.snapshots
      ? (row.snapshots as Project["snapshots"])
      : undefined,
    iconPacks,
    pluginTokensPushedAt,
    layoutMdAuthored,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function projectToRow(
  project: Project,
  userId: string
): Omit<ProjectRow, "created_at" | "scanned_components" | "scan_source" | "last_scan_at" | "github_repo" | "branding_assets" | "context_documents"> & { updated_at: string; snapshots: unknown | null } {
  // Store uploadedFonts, standardisation, pluginTokensPushedAt and iconPacks
  // inside extraction_data to avoid a dedicated DB migration.
  const fonts = project.uploadedFonts ?? [];
  const std = project.standardisation ?? undefined;
  const pushedAt = project.pluginTokensPushedAt ?? undefined;
  const icons = project.iconPacks ?? undefined;
  const authored = project.layoutMdAuthored ?? undefined;
  const hasExtra = fonts.length > 0 || std || pushedAt || (icons && icons.length > 0) || authored;
  const extractionData = project.extractionData
    ? {
        ...project.extractionData,
        _uploadedFonts: fonts,
        _standardisation: std,
        _pluginTokensPushedAt: pushedAt,
        _iconPacks: icons,
        _layoutMdAuthored: authored,
      }
    : hasExtra
      ? {
          _uploadedFonts: fonts,
          _standardisation: std,
          _pluginTokensPushedAt: pushedAt,
          _iconPacks: icons,
          _layoutMdAuthored: authored,
        }
      : null;

  return {
    id: project.id,
    org_id: project.orgId,
    name: project.name,
    source_type: project.sourceType,
    source_url: project.sourceUrl ?? null,
    layout_md: project.layoutMd,
    extraction_data: extractionData,
    token_count: project.tokenCount ?? null,
    health_score: project.healthScore ?? null,
    test_results: null,
    explorations: project.explorations ?? null,
    pending_canvas_image: project.pendingCanvasImage ?? null,
    snapshots: project.snapshots ?? null,
    // NOTE: scanned_components, scan_source, last_scan_at, github_repo,
    // branding_assets, context_documents are intentionally excluded. They are
    // managed by dedicated API endpoints only. Including them here would wipe
    // data on every project save (extraction, layout.md edit, variant
    // generation) since the browser store doesn't always have these fields
    // loaded (e.g. after fetchAllProjectsSummary).
    user_id: userId,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetch only the persisted layout_md for a project (+ its org_id for auth).
 * Used by generate/explore to avoid a stale Zustand/prop copy racing a recent
 * Monaco edit that hasn't round-tripped to the client yet.
 */
export async function fetchProjectLayoutMd(
  id: string
): Promise<{ layoutMd: string; orgId: string } | null> {
  const { data, error } = await supabase
    .from("layout_projects")
    .select("layout_md, org_id")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return { layoutMd: (data.layout_md as string) ?? "", orgId: (data.org_id as string) ?? "" };
}

export async function fetchProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("layout_projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToProject(data as ProjectRow);
}

/** Lean listing — excludes large JSON columns for fast project list loads. */
export async function fetchAllProjectsSummary(orgId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("layout_projects")
    .select("id, org_id, name, source_type, source_url, token_count, health_score, pending_canvas_image, scanned_components, scan_source, last_scan_at, github_repo, user_id, created_at, updated_at")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch projects:", error.message);
    return [];
  }

  return (data as ProjectRow[]).map((row) => ({
    ...rowToProject(row),
    layoutMd: "",
    extractionData: undefined,
    explorations: undefined,
  }));
}

/** Full project fetch including all JSON columns. */
export async function fetchAllProjects(orgId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("layout_projects")
    .select("*")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch projects:", error.message);
    return [];
  }

  return (data as ProjectRow[]).map(rowToProject);
}

export async function upsertProject(
  project: Project,
  userId: string
): Promise<void> {
  const row = projectToRow(project, userId);
  const { error } = await supabase.from("layout_projects").upsert(row, {
    onConflict: "id",
  });

  if (error) {
    throw new Error(`Failed to upsert project: ${error.message}`);
  }
}

export async function removeProject(id: string, orgId: string): Promise<void> {
  // Clean up screenshots from storage
  await deleteScreenshots(id);

  const { error } = await supabase
    .from("layout_projects")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);

  if (error) {
    console.error("Failed to delete project:", error.message);
  }
}

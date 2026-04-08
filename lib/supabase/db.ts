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
  user_id: string;
  created_at: string;
  updated_at: string;
}

function rowToProject(row: ProjectRow): Project {
  // Extract _uploadedFonts from extraction_data before casting
  const rawExtraction = row.extraction_data as Record<string, unknown> | null;
  const uploadedFonts = (rawExtraction?._uploadedFonts as Project["uploadedFonts"]) ?? undefined;

  // Strip _uploadedFonts from extraction data before casting to ExtractionResult
  let extractionData: Project["extractionData"] | undefined;
  if (rawExtraction) {
    const { _uploadedFonts: _, ...clean } = rawExtraction;
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function projectToRow(
  project: Project,
  userId: string
): Omit<ProjectRow, "created_at"> & { updated_at: string } {
  // Store uploadedFonts inside extraction_data to avoid a DB migration
  const fonts = project.uploadedFonts ?? [];
  const extractionData = project.extractionData
    ? { ...project.extractionData, _uploadedFonts: fonts }
    : fonts.length > 0
      ? { _uploadedFonts: fonts }
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
    scanned_components: project.scannedComponents ?? null,
    scan_source: project.scanSource ?? null,
    last_scan_at: project.lastScanAt ?? null,
    github_repo: project.githubRepo ?? null,
    user_id: userId,
    updated_at: new Date().toISOString(),
  };
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
    .select("id, org_id, name, source_type, source_url, token_count, health_score, pending_canvas_image, user_id, created_at, updated_at")
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

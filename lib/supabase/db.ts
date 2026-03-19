import { supabase } from "./client";
import { deleteScreenshots } from "./storage";
import type { Project } from "@/lib/types";

interface ProjectRow {
  id: string;
  org_id: string;
  name: string;
  source_type: string;
  source_url: string | null;
  design_md: string;
  extraction_data: unknown | null;
  token_count: number | null;
  health_score: number | null;
  test_results: unknown | null;
  explorations: unknown | null;
  pending_canvas_image: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    sourceType: row.source_type as Project["sourceType"],
    sourceUrl: row.source_url ?? undefined,
    designMd: row.design_md,
    extractionData: row.extraction_data
      ? (row.extraction_data as Project["extractionData"])
      : undefined,
    tokenCount: row.token_count ?? undefined,
    healthScore: row.health_score ?? undefined,
    explorations: row.explorations
      ? (row.explorations as Project["explorations"])
      : undefined,
    pendingCanvasImage: row.pending_canvas_image ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function projectToRow(
  project: Project,
  userId: string
): Omit<ProjectRow, "created_at"> & { updated_at: string } {
  // Screenshots are now Supabase Storage URLs (not base64), safe to persist
  const extractionData = project.extractionData ?? null;

  return {
    id: project.id,
    org_id: project.orgId,
    name: project.name,
    source_type: project.sourceType,
    source_url: project.sourceUrl ?? null,
    design_md: project.designMd,
    extraction_data: extractionData,
    token_count: project.tokenCount ?? null,
    health_score: project.healthScore ?? null,
    test_results: null,
    explorations: project.explorations ?? null,
    pending_canvas_image: project.pendingCanvasImage ?? null,
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
    console.error("Failed to upsert project:", error.message);
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

import { supabase } from "./client";
import type { Project } from "@/lib/types";

interface ProjectRow {
  id: string;
  name: string;
  source_type: string;
  source_url: string | null;
  design_md: string;
  extraction_data: unknown | null;
  token_count: number | null;
  health_score: number | null;
  created_at: string;
  updated_at: string;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    sourceType: row.source_type as Project["sourceType"],
    sourceUrl: row.source_url ?? undefined,
    designMd: row.design_md,
    extractionData: row.extraction_data
      ? (row.extraction_data as Project["extractionData"])
      : undefined,
    tokenCount: row.token_count ?? undefined,
    healthScore: row.health_score ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function projectToRow(project: Project): Omit<ProjectRow, "created_at" | "updated_at"> & { updated_at: string } {
  // Strip screenshots before persisting — they can be several MB of base64
  const extractionData = project.extractionData
    ? { ...project.extractionData, screenshots: [] }
    : null;

  return {
    id: project.id,
    name: project.name,
    source_type: project.sourceType,
    source_url: project.sourceUrl ?? null,
    design_md: project.designMd,
    extraction_data: extractionData,
    token_count: project.tokenCount ?? null,
    health_score: project.healthScore ?? null,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchAllProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch projects:", error.message);
    return [];
  }

  return (data as ProjectRow[]).map(rowToProject);
}

export async function upsertProject(project: Project): Promise<void> {
  const row = projectToRow(project);
  const { error } = await supabase.from("projects").upsert(row, {
    onConflict: "id",
  });

  if (error) {
    console.error("Failed to upsert project:", error.message);
  }
}

export async function removeProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete project:", error.message);
  }
}

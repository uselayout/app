import { supabase } from "./client";

export interface LayoutMdVersion {
  id: string;
  projectId: string;
  orgId: string;
  layoutMd: string;
  source: "manual" | "generation" | "extraction";
  createdBy: string | null;
  createdAt: string;
}

interface VersionRow {
  id: string;
  project_id: string;
  org_id: string;
  layout_md: string;
  source: string;
  created_by: string | null;
  created_at: string;
}

function rowToVersion(row: VersionRow): LayoutMdVersion {
  return {
    id: row.id,
    projectId: row.project_id,
    orgId: row.org_id,
    layoutMd: row.layout_md,
    source: row.source as LayoutMdVersion["source"],
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function saveLayoutMdVersion(
  projectId: string,
  orgId: string,
  layoutMd: string,
  source: LayoutMdVersion["source"],
  createdBy?: string,
): Promise<void> {
  const { error } = await supabase.from("layout_md_versions").insert({
    project_id: projectId,
    org_id: orgId,
    layout_md: layoutMd,
    source,
    created_by: createdBy ?? null,
  });
  if (error) {
    console.error("Failed to save layout.md version:", error);
  }
}

export async function listLayoutMdVersions(
  projectId: string,
  orgId: string,
): Promise<LayoutMdVersion[]> {
  const { data, error } = await supabase
    .from("layout_md_versions")
    .select("*")
    .eq("project_id", projectId)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Failed to list layout.md versions:", error);
    return [];
  }

  return (data as VersionRow[]).map(rowToVersion);
}

export async function getLayoutMdVersion(
  versionId: string,
): Promise<LayoutMdVersion | null> {
  const { data, error } = await supabase
    .from("layout_md_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (error) {
    console.error("Failed to get layout.md version:", error);
    return null;
  }

  return rowToVersion(data as VersionRow);
}

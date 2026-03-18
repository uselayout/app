import { supabase } from "./client";

export interface DesignMdVersion {
  id: string;
  projectId: string;
  orgId: string;
  designMd: string;
  source: "manual" | "generation" | "extraction";
  createdBy: string | null;
  createdAt: string;
}

interface VersionRow {
  id: string;
  project_id: string;
  org_id: string;
  design_md: string;
  source: string;
  created_by: string | null;
  created_at: string;
}

function rowToVersion(row: VersionRow): DesignMdVersion {
  return {
    id: row.id,
    projectId: row.project_id,
    orgId: row.org_id,
    designMd: row.design_md,
    source: row.source as DesignMdVersion["source"],
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function saveDesignMdVersion(
  projectId: string,
  orgId: string,
  designMd: string,
  source: DesignMdVersion["source"],
  createdBy?: string,
): Promise<void> {
  const { error } = await supabase.from("layout_design_md_versions").insert({
    project_id: projectId,
    org_id: orgId,
    design_md: designMd,
    source,
    created_by: createdBy ?? null,
  });
  if (error) {
    console.error("Failed to save DESIGN.md version:", error);
  }
}

export async function listDesignMdVersions(
  projectId: string,
  orgId: string,
): Promise<DesignMdVersion[]> {
  const { data, error } = await supabase
    .from("layout_design_md_versions")
    .select("*")
    .eq("project_id", projectId)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Failed to list DESIGN.md versions:", error);
    return [];
  }

  return (data as VersionRow[]).map(rowToVersion);
}

export async function getDesignMdVersion(
  versionId: string,
): Promise<DesignMdVersion | null> {
  const { data, error } = await supabase
    .from("layout_design_md_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (error) {
    console.error("Failed to get DESIGN.md version:", error);
    return null;
  }

  return rowToVersion(data as VersionRow);
}

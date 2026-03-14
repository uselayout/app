import { supabase } from "./client";
import type { DriftChange, DriftReport, DriftStatus } from "@/lib/types/drift";

// ─── Row Types ────────────────────────────────────────────────────────────────

interface DriftReportRow {
  id: string;
  org_id: string;
  project_id: string | null;
  source_url: string;
  source_type: string;
  status: string;
  changes: unknown;
  summary: string | null;
  token_additions: number;
  token_changes: number;
  token_removals: number;
  detected_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

// ─── Row Mapper ──────────────────────────────────────────────────────────────

function rowToReport(row: DriftReportRow): DriftReport {
  return {
    id: row.id,
    orgId: row.org_id,
    projectId: row.project_id,
    sourceUrl: row.source_url,
    sourceType: row.source_type as DriftReport["sourceType"],
    status: row.status as DriftStatus,
    changes: (row.changes ?? []) as DriftChange[],
    summary: row.summary,
    tokenAdditions: row.token_additions,
    tokenChanges: row.token_changes,
    tokenRemovals: row.token_removals,
    detectedAt: row.detected_at,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
  };
}

// ─── Drift Report CRUD ──────────────────────────────────────────────────────

export async function createDriftReport(data: {
  orgId: string;
  projectId?: string;
  sourceUrl: string;
  sourceType: "figma" | "website";
  changes: DriftChange[];
  summary?: string;
  tokenAdditions: number;
  tokenChanges: number;
  tokenRemovals: number;
}): Promise<DriftReport | null> {
  const id = crypto.randomUUID();

  const { error } = await supabase.from("layout_drift_report").insert({
    id,
    org_id: data.orgId,
    project_id: data.projectId ?? null,
    source_url: data.sourceUrl,
    source_type: data.sourceType,
    status: "pending",
    changes: data.changes,
    summary: data.summary ?? null,
    token_additions: data.tokenAdditions,
    token_changes: data.tokenChanges,
    token_removals: data.tokenRemovals,
  });

  if (error) {
    console.error("Failed to create drift report:", error.message);
    return null;
  }

  return getDriftReportById(id);
}

export async function getDriftReportsByOrg(
  orgId: string,
  filters?: { status?: DriftStatus }
): Promise<DriftReport[]> {
  let query = supabase
    .from("layout_drift_report")
    .select("*")
    .eq("org_id", orgId)
    .order("detected_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return (data as DriftReportRow[]).map(rowToReport);
}

export async function getDriftReportById(
  id: string
): Promise<DriftReport | null> {
  const { data, error } = await supabase
    .from("layout_drift_report")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToReport(data as DriftReportRow);
}

export async function updateDriftReportStatus(
  id: string,
  status: DriftStatus,
  reviewedBy?: string
): Promise<void> {
  const row: Record<string, unknown> = { status };

  if (status === "reviewed" || status === "resolved") {
    row.reviewed_at = new Date().toISOString();
    if (reviewedBy) {
      row.reviewed_by = reviewedBy;
    }
  }

  const { error } = await supabase
    .from("layout_drift_report")
    .update(row)
    .eq("id", id);

  if (error) {
    console.error("Failed to update drift report status:", error.message);
  }
}

export async function deleteDriftReport(id: string): Promise<void> {
  const { error } = await supabase
    .from("layout_drift_report")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete drift report:", error.message);
  }
}

import { supabase } from "./client";
import type {
  Candidate,
  CandidateComment,
  CandidateStatus,
  CandidateVariant,
} from "@/lib/types/candidate";

// ─── Row Types ────────────────────────────────────────────────────────────────

interface CandidateRow {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  category: string;
  component_id: string | null;
  prompt: string;
  design_md_snapshot: string | null;
  variants: unknown;
  selected_variant_index: number | null;
  status: string;
  created_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CandidateCommentRow {
  id: string;
  candidate_id: string;
  author_id: string;
  author_name: string | null;
  body: string;
  variant_index: number | null;
  created_at: string;
}

// ─── Row Mappers ──────────────────────────────────────────────────────────────

function rowToCandidate(row: CandidateRow): Candidate {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    description: row.description,
    category: row.category,
    componentId: row.component_id,
    prompt: row.prompt,
    designMdSnapshot: row.design_md_snapshot,
    variants: (row.variants ?? []) as CandidateVariant[],
    selectedVariantIndex: row.selected_variant_index,
    status: row.status as CandidateStatus,
    createdBy: row.created_by,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToComment(row: CandidateCommentRow): CandidateComment {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    authorId: row.author_id,
    authorName: row.author_name,
    body: row.body,
    variantIndex: row.variant_index,
    createdAt: row.created_at,
  };
}

// ─── Candidate CRUD ───────────────────────────────────────────────────────────

export async function getCandidate(id: string): Promise<Candidate | null> {
  const { data, error } = await supabase
    .from("layout_candidate")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToCandidate(data as CandidateRow);
}

export async function getCandidatesByOrg(
  orgId: string,
  opts?: { status?: CandidateStatus; search?: string }
): Promise<Candidate[]> {
  let query = supabase
    .from("layout_candidate")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (opts?.status) {
    query = query.eq("status", opts.status);
  }
  if (opts?.search) {
    query = query.ilike("name", `%${opts.search}%`);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return (data as CandidateRow[]).map(rowToCandidate);
}

export async function createCandidate(data: {
  orgId: string;
  name: string;
  prompt: string;
  description?: string;
  category?: string;
  componentId?: string;
  variants: CandidateVariant[];
  designMdSnapshot?: string;
  createdBy: string;
}): Promise<Candidate | null> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const { error } = await supabase.from("layout_candidate").insert({
    id,
    org_id: data.orgId,
    name: data.name,
    description: data.description ?? null,
    category: data.category ?? "uncategorised",
    component_id: data.componentId ?? null,
    prompt: data.prompt,
    design_md_snapshot: data.designMdSnapshot ?? null,
    variants: data.variants,
    selected_variant_index: null,
    status: "pending",
    created_by: data.createdBy,
    reviewed_by: null,
    reviewed_at: null,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.error("Failed to create candidate:", error.message);
    return null;
  }

  return getCandidate(id);
}

export async function updateCandidateStatus(
  id: string,
  status: CandidateStatus,
  reviewedBy?: string
): Promise<void> {
  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    status,
    updated_at: now,
  };

  if (reviewedBy) {
    row.reviewed_by = reviewedBy;
  }

  if (status === "approved" || status === "rejected") {
    row.reviewed_at = now;
  }

  const { error } = await supabase
    .from("layout_candidate")
    .update(row)
    .eq("id", id);

  if (error) {
    console.error("Failed to update candidate status:", error.message);
  }
}

export async function selectCandidateVariant(
  id: string,
  variantIndex: number
): Promise<void> {
  const { error } = await supabase
    .from("layout_candidate")
    .update({
      selected_variant_index: variantIndex,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to select candidate variant:", error.message);
  }
}

export async function deleteCandidate(id: string): Promise<void> {
  const { error } = await supabase
    .from("layout_candidate")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete candidate:", error.message);
  }
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getCandidateComments(
  candidateId: string
): Promise<CandidateComment[]> {
  const { data, error } = await supabase
    .from("layout_candidate_comment")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as CandidateCommentRow[]).map(rowToComment);
}

export async function addCandidateComment(data: {
  candidateId: string;
  authorId: string;
  authorName?: string;
  body: string;
  variantIndex?: number;
}): Promise<CandidateComment | null> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const { error } = await supabase.from("layout_candidate_comment").insert({
    id,
    candidate_id: data.candidateId,
    author_id: data.authorId,
    author_name: data.authorName ?? null,
    body: data.body,
    variant_index: data.variantIndex ?? null,
    created_at: now,
  });

  if (error) {
    console.error("Failed to add candidate comment:", error.message);
    return null;
  }

  // Return the inserted comment directly rather than re-querying
  return {
    id,
    candidateId: data.candidateId,
    authorId: data.authorId,
    authorName: data.authorName ?? null,
    body: data.body,
    variantIndex: data.variantIndex ?? null,
    createdAt: now,
  };
}

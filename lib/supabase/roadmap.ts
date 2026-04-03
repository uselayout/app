import { supabase } from "./client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type RoadmapProduct = "studio" | "cli" | "figma-plugin" | "chrome-extension";
export type RoadmapStatus = "considering" | "planned" | "in_progress" | "shipped";

export interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  product: string;
  status: string;
  sortOrder: number;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
}

interface RoadmapItemRow {
  id: string;
  title: string;
  description: string | null;
  product: string;
  status: string;
  sort_order: number;
  vote_count: number;
  created_at: string;
  updated_at: string;
}

interface RoadmapVoteRow {
  id: string;
  item_id: string;
  voter_id: string;
  created_at: string;
}

// ─── Row Mapper ──────────────────────────────────────────────────────────────

function rowToRoadmapItem(row: RoadmapItemRow): RoadmapItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    product: row.product,
    status: row.status,
    sortOrder: row.sort_order,
    voteCount: row.vote_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Status ordering for consistent sorting ──────────────────────────────────

const STATUS_ORDER: Record<string, number> = {
  in_progress: 0,
  planned: 1,
  considering: 2,
  shipped: 3,
};

// ─── CRUD Functions ──────────────────────────────────────────────────────────

/**
 * Get all roadmap items, ordered by status priority then sort_order.
 */
export async function getRoadmapItems(): Promise<RoadmapItem[]> {
  const { data, error } = await supabase
    .from("layout_roadmap_item")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch roadmap items:", error);
    return [];
  }

  const rows = (data ?? []) as RoadmapItemRow[];

  // Sort by status priority, then sort_order within each status
  return rows
    .sort((a, b) => {
      const statusDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      return a.sort_order - b.sort_order;
    })
    .map(rowToRoadmapItem);
}

/**
 * Get roadmap items filtered by status.
 */
export async function getRoadmapItemsByStatus(status: string): Promise<RoadmapItem[]> {
  const { data, error } = await supabase
    .from("layout_roadmap_item")
    .select("*")
    .eq("status", status)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch roadmap items by status:", error);
    return [];
  }

  return ((data ?? []) as RoadmapItemRow[]).map(rowToRoadmapItem);
}

/**
 * Create a new roadmap item.
 */
export async function createRoadmapItem(item: {
  title: string;
  description?: string;
  product: string;
  status: string;
}): Promise<RoadmapItem | null> {
  const { data, error } = await supabase
    .from("layout_roadmap_item")
    .insert({
      title: item.title,
      description: item.description ?? null,
      product: item.product,
      status: item.status,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create roadmap item:", error);
    return null;
  }

  return rowToRoadmapItem(data as RoadmapItemRow);
}

/**
 * Update an existing roadmap item. Returns true on success.
 */
export async function updateRoadmapItem(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    product: string;
    status: string;
    sortOrder: number;
  }>
): Promise<boolean> {
  // Map camelCase to snake_case
  const row: Record<string, unknown> = {};
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.product !== undefined) row.product = updates.product;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.sortOrder !== undefined) row.sort_order = updates.sortOrder;

  const { error } = await supabase
    .from("layout_roadmap_item")
    .update(row)
    .eq("id", id);

  if (error) {
    console.error("Failed to update roadmap item:", error);
    return false;
  }

  return true;
}

/**
 * Delete a roadmap item by ID. Returns true on success.
 */
export async function deleteRoadmapItem(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("layout_roadmap_item")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete roadmap item:", error);
    return false;
  }

  return true;
}

/**
 * Toggle a vote on a roadmap item. If the voter has already voted, remove the vote.
 * Otherwise, add a vote. Returns the new voted state and updated count.
 */
export async function toggleVote(
  itemId: string,
  voterId: string
): Promise<{ voted: boolean; newCount: number }> {
  // Check for existing vote
  const { data: existing, error: fetchError } = await supabase
    .from("layout_roadmap_vote")
    .select("id")
    .eq("item_id", itemId)
    .eq("voter_id", voterId)
    .maybeSingle();

  if (fetchError) {
    console.error("Failed to check existing vote:", fetchError);
    return { voted: false, newCount: 0 };
  }

  if (existing) {
    // Remove vote
    const { error: deleteError } = await supabase
      .from("layout_roadmap_vote")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      console.error("Failed to remove vote:", deleteError);
      return { voted: true, newCount: 0 };
    }

    // Decrement vote_count
    const { data: updated, error: updateError } = await supabase
      .rpc("decrement_vote_count", { row_id: itemId })
      .single();

    if (updateError) {
      // Fallback: read the current count
      console.error("Failed to decrement vote count via RPC, falling back:", updateError);
      const { data: item } = await supabase
        .from("layout_roadmap_item")
        .select("vote_count")
        .eq("id", itemId)
        .single();
      const currentCount = (item as RoadmapItemRow | null)?.vote_count ?? 0;
      const newCount = Math.max(0, currentCount - 1);
      await supabase
        .from("layout_roadmap_item")
        .update({ vote_count: newCount })
        .eq("id", itemId);
      return { voted: false, newCount };
    }

    return { voted: false, newCount: (updated as { vote_count: number })?.vote_count ?? 0 };
  } else {
    // Add vote
    const { error: insertError } = await supabase
      .from("layout_roadmap_vote")
      .insert({ item_id: itemId, voter_id: voterId });

    if (insertError) {
      console.error("Failed to add vote:", insertError);
      return { voted: false, newCount: 0 };
    }

    // Increment vote_count
    const { data: updated, error: updateError } = await supabase
      .rpc("increment_vote_count", { row_id: itemId })
      .single();

    if (updateError) {
      // Fallback: read the current count
      console.error("Failed to increment vote count via RPC, falling back:", updateError);
      const { data: item } = await supabase
        .from("layout_roadmap_item")
        .select("vote_count")
        .eq("id", itemId)
        .single();
      const currentCount = (item as RoadmapItemRow | null)?.vote_count ?? 0;
      const newCount = currentCount + 1;
      await supabase
        .from("layout_roadmap_item")
        .update({ vote_count: newCount })
        .eq("id", itemId);
      return { voted: true, newCount };
    }

    return { voted: true, newCount: (updated as { vote_count: number })?.vote_count ?? 0 };
  }
}

/**
 * Get all item IDs that a voter has voted for.
 */
export async function getVotedItems(voterId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("layout_roadmap_vote")
    .select("item_id")
    .eq("voter_id", voterId);

  if (error) {
    console.error("Failed to fetch voted items:", error);
    return new Set();
  }

  return new Set(
    ((data ?? []) as Pick<RoadmapVoteRow, "item_id">[]).map((row) => row.item_id)
  );
}

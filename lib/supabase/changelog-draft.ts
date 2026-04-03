import { supabase } from "@/lib/supabase/client";
import type { ChangelogEntry } from "@/lib/types/changelog";

const TABLE = "layout_changelog_draft";

/**
 * Read all draft changelog entries, ordered by sort_order then created_at DESC.
 */
export async function readDraftEntries(): Promise<ChangelogEntry[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, title, description, product, category, date")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to read draft changelog entries:", error.message);
    return [];
  }

  return (data ?? []) as ChangelogEntry[];
}

/**
 * Replace all draft entries with the given array.
 * Deletes everything first, then inserts with sort_order from array index.
 */
export async function writeDraftEntries(
  entries: ChangelogEntry[]
): Promise<void> {
  // Delete all existing drafts
  const { error: deleteError } = await supabase
    .from(TABLE)
    .delete()
    .gte("sort_order", 0); // match all rows (Supabase requires a filter for delete)

  if (deleteError) {
    console.error("Failed to clear draft entries before write:", deleteError.message);
    return;
  }

  if (entries.length === 0) return;

  const rows = entries.map((entry, index) => ({
    id: entry.id,
    title: entry.title,
    description: entry.description,
    product: entry.product,
    category: entry.category,
    date: entry.date,
    sort_order: index,
  }));

  const { error: insertError } = await supabase.from(TABLE).insert(rows);

  if (insertError) {
    console.error("Failed to write draft changelog entries:", insertError.message);
  }
}

/**
 * Delete all draft entries (used after publishing a changelog week).
 */
export async function clearDraftEntries(): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .gte("sort_order", 0); // match all rows

  if (error) {
    console.error("Failed to clear draft changelog entries:", error.message);
  }
}

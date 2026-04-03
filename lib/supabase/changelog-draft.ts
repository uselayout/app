import { supabase } from "@/lib/supabase/client";
import type { ChangelogEntry, ChangelogWeek, ChangelogItem } from "@/lib/types/changelog";

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

// ─── Published Weeks ─────────────────────────────────────────────────────────

const PUBLISHED_TABLE = "layout_changelog_published";

/**
 * Publish a compiled week to Supabase and clear drafts.
 */
export async function publishWeekToDb(week: ChangelogWeek): Promise<void> {
  const { error } = await supabase.from(PUBLISHED_TABLE).upsert({
    week_id: week.weekId,
    label: week.label,
    summary: week.summary,
    items: week.items,
  }, { onConflict: "week_id" });

  if (error) {
    console.error("Failed to publish changelog week:", error.message);
    throw new Error(`Failed to publish: ${error.message}`);
  }

  await clearDraftEntries();
}

/**
 * Read all published weeks from Supabase, newest first.
 */
export async function getPublishedWeeks(): Promise<ChangelogWeek[]> {
  const { data, error } = await supabase
    .from(PUBLISHED_TABLE)
    .select("week_id, label, summary, items")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to read published weeks:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    weekId: row.week_id as string,
    label: row.label as string,
    summary: row.summary as string,
    items: row.items as ChangelogItem[],
  }));
}

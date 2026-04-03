#!/usr/bin/env npx tsx
/**
 * Add changelog entries directly to Supabase.
 * Usage: npx tsx scripts/add-changelog.ts
 *
 * Reads entries from content/changelog/draft.ts and upserts them
 * into the layout_changelog_draft table. Safe to run multiple times.
 */

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();
import { createClient } from "@supabase/supabase-js";
import { draftEntries } from "../content/changelog/draft";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase URL or key in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  if (draftEntries.length === 0) {
    console.log("No draft entries to sync.");
    return;
  }

  const rows = draftEntries.map((entry, index) => ({
    id: entry.id,
    title: entry.title,
    description: entry.description,
    product: entry.product,
    category: entry.category,
    date: entry.date,
    sort_order: index,
  }));

  const { error } = await supabase
    .from("layout_changelog_draft")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("Failed to sync:", error.message);
    process.exit(1);
  }

  console.log(`Synced ${rows.length} draft entries to Supabase.`);
}

main();

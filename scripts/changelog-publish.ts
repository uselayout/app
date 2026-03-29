#!/usr/bin/env npx tsx

/**
 * Moves draft changelog entries into published.ts as a new week.
 *
 * Usage:
 *   npm run changelog:publish              # Publish current draft
 *   npm run changelog:publish -- --dry-run # Preview without writing
 */

import { hasDraftEntries, getDraftEntryCount, publishDraft } from "../lib/changelog/publish";

const dryRun = process.argv.includes("--dry-run");

function main() {
  if (!hasDraftEntries()) {
    console.log("No draft entries to publish.");
    process.exit(0);
  }

  const count = getDraftEntryCount();

  if (dryRun) {
    console.log(`[DRY RUN] Would publish ${count} entries.`);
    console.log("Run without --dry-run to publish.");
    process.exit(0);
  }

  const result = publishDraft();
  console.log(`Done. Published ${result.entryCount} entries for ${result.label} (${result.weekId}).`);
  console.log("Draft cleared. Commit and deploy to go live.");
}

main();

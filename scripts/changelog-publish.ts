#!/usr/bin/env npx tsx

/**
 * Moves draft changelog entries into published.ts as a new week.
 *
 * Usage:
 *   npm run changelog:publish              # Publish current draft
 *   npm run changelog:publish -- --dry-run # Preview without writing
 */

import * as fs from "fs";
import * as path from "path";

const CONTENT_DIR = path.join(__dirname, "..", "content", "changelog");
const DRAFT_PATH = path.join(CONTENT_DIR, "draft.ts");
const PUBLISHED_PATH = path.join(CONTENT_DIR, "published.ts");

const dryRun = process.argv.includes("--dry-run");

// Dynamically import the draft entries
async function main() {
  // Read draft file to check for entries (simple regex check)
  const draftContent = fs.readFileSync(DRAFT_PATH, "utf-8");

  // Check if the array is empty
  const arrayMatch = draftContent.match(
    /export const draftEntries[^=]*=\s*\[([\s\S]*?)\];/
  );
  if (!arrayMatch || arrayMatch[1].trim() === "") {
    console.log("No draft entries to publish.");
    process.exit(0);
  }

  // Extract the entries block (everything inside the array)
  const entriesBlock = arrayMatch[1].trim();

  // Calculate ISO week
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000
  );
  const weekNum = Math.ceil((dayOfYear + jan4.getDay() + 1) / 7);
  const weekId = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;

  // Get Monday of current week
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const label = `Week of ${monday.getDate()} ${months[monday.getMonth()]} ${monday.getFullYear()}`;

  // Count entries (rough count by counting 'id:' occurrences)
  const entryCount = (entriesBlock.match(/id:/g) || []).length;

  console.log(`Publishing ${entryCount} entries for ${label} (${weekId})`);

  if (dryRun) {
    console.log("\n[DRY RUN] Would publish the following entries:\n");
    console.log(entriesBlock);
    console.log("\nRun without --dry-run to publish.");
    process.exit(0);
  }

  // Build the new week block
  const newWeek = `  {
    weekId: "${weekId}",
    label: "${label}",
    entries: [
      ${entriesBlock}
    ],
  },`;

  // Read published.ts and insert the new week at the top of the array
  const publishedContent = fs.readFileSync(PUBLISHED_PATH, "utf-8");
  const insertPoint = publishedContent.indexOf(
    "export const publishedWeeks: ChangelogWeek[] = ["
  );
  if (insertPoint === -1) {
    console.error(
      "Could not find publishedWeeks array in published.ts"
    );
    process.exit(1);
  }

  const arrayStart =
    publishedContent.indexOf("[", insertPoint) + 1;
  const updatedPublished =
    publishedContent.slice(0, arrayStart) +
    "\n" +
    newWeek +
    publishedContent.slice(arrayStart);

  fs.writeFileSync(PUBLISHED_PATH, updatedPublished, "utf-8");

  // Reset draft.ts
  const emptyDraft = `import type { ChangelogEntry } from "@/lib/types/changelog";

/**
 * Draft entries for the current week.
 * Run \`npm run changelog:publish\` to move these to published.ts.
 *
 * Write titles and descriptions for users, not developers.
 * Good: "Faster Figma extraction" / "Design tokens now extract 3x faster from large Figma files."
 * Bad:  "perf: optimise batch node fetching"
 */
export const draftEntries: ChangelogEntry[] = [];
`;

  fs.writeFileSync(DRAFT_PATH, emptyDraft, "utf-8");

  console.log(`Done. Published ${entryCount} entries for ${label}.`);
  console.log("Draft cleared. Commit and deploy to go live.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

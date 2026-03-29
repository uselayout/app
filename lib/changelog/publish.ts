import * as fs from "fs";
import * as path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content", "changelog");
const DRAFT_PATH = path.join(CONTENT_DIR, "draft.ts");
const PUBLISHED_PATH = path.join(CONTENT_DIR, "published.ts");

const EMPTY_DRAFT = `import type { ChangelogEntry } from "@/lib/types/changelog";

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

function getISOWeek(): { weekId: string; label: string } {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000
  );
  const weekNum = Math.ceil((dayOfYear + jan4.getDay() + 1) / 7);
  const weekId = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;

  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const label = `Week of ${monday.getDate()} ${months[monday.getMonth()]} ${monday.getFullYear()}`;

  return { weekId, label };
}

function readDraftBlock(): { entriesBlock: string; entryCount: number } | null {
  const draftContent = fs.readFileSync(DRAFT_PATH, "utf-8");
  const arrayMatch = draftContent.match(
    /export const draftEntries[^=]*=\s*\[([\s\S]*?)\];/
  );
  if (!arrayMatch || arrayMatch[1].trim() === "") {
    return null;
  }
  const entriesBlock = arrayMatch[1].trim();
  const entryCount = (entriesBlock.match(/id:/g) || []).length;
  return { entriesBlock, entryCount };
}

export function hasDraftEntries(): boolean {
  return readDraftBlock() !== null;
}

export function getDraftEntryCount(): number {
  const draft = readDraftBlock();
  return draft ? draft.entryCount : 0;
}

export function publishDraft(): { weekId: string; label: string; entryCount: number } {
  const draft = readDraftBlock();
  if (!draft) {
    throw new Error("No draft entries to publish");
  }

  const { weekId, label } = getISOWeek();

  const newWeek = `  {
    weekId: "${weekId}",
    label: "${label}",
    entries: [
      ${draft.entriesBlock}
    ],
  },`;

  const publishedContent = fs.readFileSync(PUBLISHED_PATH, "utf-8");
  const insertPoint = publishedContent.indexOf(
    "export const publishedWeeks: ChangelogWeek[] = ["
  );
  if (insertPoint === -1) {
    throw new Error("Could not find publishedWeeks array in published.ts");
  }

  const arrayStart = publishedContent.indexOf("[", insertPoint) + 1;
  const updatedPublished =
    publishedContent.slice(0, arrayStart) +
    "\n" +
    newWeek +
    publishedContent.slice(arrayStart);

  fs.writeFileSync(PUBLISHED_PATH, updatedPublished, "utf-8");
  fs.writeFileSync(DRAFT_PATH, EMPTY_DRAFT, "utf-8");

  return { weekId, label, entryCount: draft.entryCount };
}

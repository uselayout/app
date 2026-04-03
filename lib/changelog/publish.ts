import * as fs from "fs";
import * as path from "path";
import type { ChangelogEntry, ChangelogItem, ChangelogWeek } from "@/lib/types/changelog";

const CONTENT_DIR = path.join(process.cwd(), "content", "changelog");
const DRAFT_PATH = path.join(CONTENT_DIR, "draft.ts");
const PUBLISHED_PATH = path.join(CONTENT_DIR, "published.ts");

const DRAFT_HEADER = `import type { ChangelogEntry } from "@/lib/types/changelog";

/**
 * Draft entries for the current week.
 * Run \`npm run changelog:publish\` to move these to published.ts.
 *
 * Write titles and descriptions for users, not developers.
 * Good: "Faster Figma extraction" / "Design tokens now extract 3x faster from large Figma files."
 * Bad:  "perf: optimise batch node fetching"
 */
`;

function buildDraftFile(entries: ChangelogEntry[]): string {
  if (entries.length === 0) {
    return DRAFT_HEADER + "export const draftEntries: ChangelogEntry[] = [];\n";
  }

  const entriesJson = entries
    .map((e) => {
      const lines = [
        `    {`,
        `      id: ${JSON.stringify(e.id)},`,
        `      title: ${JSON.stringify(e.title)},`,
        `      description:`,
        `        ${JSON.stringify(e.description)},`,
        `      product: ${JSON.stringify(e.product)},`,
        `      category: ${JSON.stringify(e.category)},`,
        `      date: ${JSON.stringify(e.date)},`,
        `    }`,
      ];
      return lines.join("\n");
    })
    .join(",\n");

  return DRAFT_HEADER + `export const draftEntries: ChangelogEntry[] = [\n${entriesJson},\n];\n`;
}

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

export function writeDraftEntries(entries: ChangelogEntry[]): void {
  fs.writeFileSync(DRAFT_PATH, buildDraftFile(entries), "utf-8");
}

/** Read draft entries from disk (bypasses module cache) */
export function readDraftEntries(): ChangelogEntry[] {
  const content = fs.readFileSync(DRAFT_PATH, "utf-8");
  const arrayMatch = content.match(
    /export const draftEntries[^=]*=\s*\[([\s\S]*?)\];/
  );
  if (!arrayMatch || arrayMatch[1].trim() === "") return [];

  const block = arrayMatch[1];
  const entries: ChangelogEntry[] = [];
  const entryRegex = /\{[^{}]*?id:\s*"([^"]*)"[^{}]*?title:\s*"([^"]*)"[^{}]*?description:\s*\n?\s*"((?:[^"\\]|\\.)*)"\s*,[^{}]*?product:\s*"([^"]*)"[^{}]*?category:\s*"([^"]*)"[^{}]*?date:\s*"([^"]*)"/g;

  let match: RegExpExecArray | null;
  while ((match = entryRegex.exec(block)) !== null) {
    entries.push({
      id: match[1],
      title: match[2],
      description: match[3].replace(/\\"/g, '"').replace(/\\n/g, "\n"),
      product: match[4] as ChangelogEntry["product"],
      category: match[5] as ChangelogEntry["category"],
      date: match[6],
    });
  }

  return entries;
}

/** Compile draft entries into a weekly changelog structure */
export function compileDraft(entries: ChangelogEntry[]): {
  weekId: string;
  label: string;
  summary: string;
  items: ChangelogItem[];
} {
  const { weekId, label } = getISOWeek();

  const items: ChangelogItem[] = entries.map((e) => ({
    text: e.title,
    product: e.product,
    category: e.category,
  }));

  // Auto-generate a summary from the entries
  const newCount = entries.filter((e) => e.category === "new").length;
  const improvedCount = entries.filter((e) => e.category === "improved").length;
  const fixedCount = entries.filter((e) => e.category === "fixed").length;

  const parts: string[] = [];
  if (newCount > 0) parts.push(`${newCount} new feature${newCount === 1 ? "" : "s"}`);
  if (improvedCount > 0) parts.push(`${improvedCount} improvement${improvedCount === 1 ? "" : "s"}`);
  if (fixedCount > 0) parts.push(`${fixedCount} fix${fixedCount === 1 ? "" : "es"}`);

  const countStr = parts.length <= 2
    ? parts.join(" and ")
    : parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1];

  const products = [...new Set(entries.map((e) => e.product))];
  const productNames: Record<string, string> = {
    studio: "Studio", cli: "CLI", "figma-plugin": "Figma Plugin", "chrome-extension": "Chrome Extension",
  };
  const productStr = products.map((p) => productNames[p] || p).join(", ");

  const highlights = entries.filter((e) => e.category === "new").slice(0, 3).map((e) => e.title);
  const highlightStr = highlights.length > 0
    ? ` Highlights: ${highlights.join(", ")}.`
    : "";

  const summary = `${countStr} across ${productStr}.${highlightStr}`;

  return { weekId, label, summary, items };
}

/** Publish a compiled weekly entry to published.ts and clear the draft */
export function publishWeek(week: ChangelogWeek): void {
  const itemsStr = week.items
    .map(
      (item) =>
        `      { text: ${JSON.stringify(item.text)}, product: ${JSON.stringify(item.product)}, category: ${JSON.stringify(item.category)} }`
    )
    .join(",\n");

  const newWeek = `  {
    weekId: ${JSON.stringify(week.weekId)},
    label: ${JSON.stringify(week.label)},
    summary:
      ${JSON.stringify(week.summary)},
    items: [
${itemsStr},
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
  writeDraftEntries([]);
}

/** CLI convenience: compile and publish in one step */
export function publishDraft(): { weekId: string; label: string; entryCount: number } {
  // Dynamic import of draft entries for CLI usage
  const draftContent = fs.readFileSync(DRAFT_PATH, "utf-8");
  const arrayMatch = draftContent.match(
    /export const draftEntries[^=]*=\s*\[([\s\S]*?)\];/
  );
  if (!arrayMatch || arrayMatch[1].trim() === "") {
    throw new Error("No draft entries to publish");
  }

  // For CLI, we need to import the actual entries
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { draftEntries } = require("../../content/changelog/draft") as { draftEntries: ChangelogEntry[] };

  if (draftEntries.length === 0) {
    throw new Error("No draft entries to publish");
  }

  const compiled = compileDraft(draftEntries);
  const week: ChangelogWeek = {
    weekId: compiled.weekId,
    label: compiled.label,
    summary: compiled.summary,
    items: compiled.items,
  };

  publishWeek(week);
  return { weekId: week.weekId, label: week.label, entryCount: week.items.length };
}

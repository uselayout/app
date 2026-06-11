import type { ChangelogEntry } from "@/lib/types/changelog";

/**
 * Draft entries awaiting publication.
 * After adding entries, run: npx tsx scripts/add-changelog.ts --env <staging|production>
 *
 * Keep this file to ONLY the currently-unpublished entries. After publishing a
 * week in admin, remove the entries you just published from this array — the
 * publish flow clears the draft *table* but not this *file*. (The sync script
 * also skips any title already published, as a safety net.)
 *
 * Write titles and descriptions for users, not developers.
 * Good: "Faster Figma extraction" / "Design tokens now extract 3x faster from large Figma files."
 * Bad:  "perf: optimise batch node fetching"
 */
export const draftEntries: ChangelogEntry[] = [
  {
    id: "2026-06-11-install-cli-modal-light-theme",
    title: "Install CLI modal readable in light theme",
    description:
      "The Install CLI popup on the homepage now always renders in dark style, fixing unreadable light-grey text for visitors using the light theme. It also shows the current tool count: 19 MCP design tools and 15 CLI commands.",
    product: "studio",
    category: "fixed",
    date: "2026-06-11",
  },
];

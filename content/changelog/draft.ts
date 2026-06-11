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
  // Published 11 June 2026 (week 2026-06-11): update opt-in, view-mode nav
  // fix, Figma-style properties panel. The dev-server reconnect entry below
  // stays until staging-live-devserver-fixes is merged and released.
  {
    id: "2026-w24-live-devserver-reconnect-fix",
    title: "Switching projects now finds your running dev server",
    description:
      "Fixed a bug where opening a different project folder could leave the preview blank even though your dev server was running: a previously remembered address was blocking the port scan. Layout Live now checks the remembered address is actually alive before using it, and the Refresh button retries the dev server search instead of doing nothing when the preview never connected.",
    product: "live",
    category: "fixed",
    date: "2026-06-11",
  },
];

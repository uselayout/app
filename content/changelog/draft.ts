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
export const draftEntries: ChangelogEntry[] = [];

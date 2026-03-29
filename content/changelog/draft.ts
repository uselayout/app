import type { ChangelogEntry } from "@/lib/types/changelog";

/**
 * Draft entries for the current week.
 * Run `npm run changelog:publish` to move these to published.ts.
 *
 * Write titles and descriptions for users, not developers.
 * Good: "Faster Figma extraction" / "Design tokens now extract 3x faster from large Figma files."
 * Bad:  "perf: optimise batch node fetching"
 */
export const draftEntries: ChangelogEntry[] = [
  {
    id: "2026-w13-changelog-system",
    title: "Weekly changelog",
    description:
      "New changelog page with product filtering across Studio, CLI, Figma Plugin, and Chrome Extension. Updated weekly.",
    product: "studio",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-admin-changelog",
    title: "Changelog management in admin",
    description:
      "Preview, add, edit, and remove changelog entries directly from the admin panel. Publish the week's updates with one click.",
    product: "studio",
    category: "new",
    date: "2026-03-29",
  },
];

import type { ChangelogEntry } from "@/lib/types/changelog";

/**
 * Draft entries for the current week.
 * After adding entries, run: npx tsx scripts/add-changelog.ts
 *
 * Write titles and descriptions for users, not developers.
 * Good: "Faster Figma extraction" / "Design tokens now extract 3x faster from large Figma files."
 * Bad:  "perf: optimise batch node fetching"
 */
export const draftEntries: ChangelogEntry[] = [
  {
    id: "2026-w14-paper-push",
    title: "Push designs to Paper.design",
    description:
      "Send AI-generated variants directly to Paper as HTML/CSS for visual editing and collaboration.",
    product: "studio",
    category: "new",
    date: "2026-04-03",
  },
  {
    id: "2026-w14-public-roadmap",
    title: "Public product roadmap",
    description:
      "New roadmap page at layout.design/roadmap with voting. See what we're building and upvote the features you want.",
    product: "studio",
    category: "new",
    date: "2026-04-03",
  },
  {
    id: "2026-w14-outreach-emails",
    title: "Cold outreach with unsubscribe",
    description:
      "Send targeted outreach emails from admin with bulk paste, auto name extraction, and one-click unsubscribe links.",
    product: "studio",
    category: "new",
    date: "2026-04-03",
  },
  {
    id: "2026-w14-changelog-supabase",
    title: "Changelog persists across deploys",
    description:
      "Draft and published changelog entries now stored in the database instead of files, so edits survive redeployments.",
    product: "studio",
    category: "fixed",
    date: "2026-04-03",
  },
];

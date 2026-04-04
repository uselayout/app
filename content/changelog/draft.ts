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
  {
    id: "2026-w14-health-tooltip",
    title: "Health score breakdown on hover",
    description:
      "Hover the compliance score badge on any variant to see a full breakdown: token faithfulness, component accuracy, anti-pattern violations, and issue count.",
    product: "studio",
    category: "improved",
    date: "2026-04-03",
  },
  {
    id: "2026-w14-figma-url-autofill",
    title: "Push to Figma auto-fills your file URL",
    description:
      "When pushing a variant to Figma, the target file URL is now pre-filled from your extraction source. You can still change it.",
    product: "studio",
    category: "improved",
    date: "2026-04-03",
  },
  {
    id: "2026-w14-inspector-buttons",
    title: "Inspector now selects all button types",
    description:
      "Fixed an issue where clicking certain interactive buttons in the inspector wouldn't open the edit panel.",
    product: "studio",
    category: "fixed",
    date: "2026-04-03",
  },
  {
    id: "2026-w14-generate-from-figma",
    title: "Generate code from Figma frames",
    description:
      "New 'Generate from this frame' button in the Figma tab. Captures the frame screenshot and structural data (text, colours, spacing, layout), then generates 2-6 code variants that closely match your Figma design using your design system tokens.",
    product: "studio",
    category: "new",
    date: "2026-04-04",
  },
  {
    id: "2026-w14-explorations-persist",
    title: "Generated variants survive page refresh",
    description:
      "Previously, generated code variants would disappear when you refreshed the page. They now persist and reload automatically.",
    product: "studio",
    category: "fixed",
    date: "2026-04-04",
  },
  {
    id: "2026-w14-health-issues-detail",
    title: "See exactly why your compliance score is low",
    description:
      "Health score tooltips now list each specific issue: hardcoded colours, unknown fonts, off-grid spacing. Know exactly what to fix to improve your score.",
    product: "studio",
    category: "improved",
    date: "2026-04-04",
  },
  {
    id: "2026-w14-retry-render",
    title: "Retry render without regenerating",
    description:
      "Failed variant previews now show 'Retry render' instead of 'Regenerate', which retries the preview without burning AI credits on a full re-generation.",
    product: "studio",
    category: "fixed",
    date: "2026-04-04",
  },
  {
    id: "2026-w14-inspector-exit-bleed",
    title: "Fixed accidental actions when exiting Inspector",
    description:
      "Clicking 'Exit Inspector' no longer triggers buttons underneath the overlay, which could accidentally start an extraction.",
    product: "studio",
    category: "fixed",
    date: "2026-04-04",
  },
];

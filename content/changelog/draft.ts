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
    id: "2026-w16-surgical-layout-edits",
    title: "AI chat edits layout.md surgically",
    description:
      "The editor chat no longer rewrites your entire layout.md when you ask for a small change. The AI now returns just the lines that need to change and they're applied in place, so untouched sections stay byte-identical and the \"Writing... 100 lines\" full-file rewrite is gone.",
    product: "studio",
    category: "fixed",
    date: "2026-04-19",
  },
  {
    id: "2026-w16-start-blank",
    title: "Start with a blank design system",
    description:
      "New projects no longer need a Figma file or live website. Pick \"Start blank\" in the New Project modal to get an empty kit with standard section headings, then add tokens, branding, and context from the Source Panel as you go.",
    product: "studio",
    category: "new",
    date: "2026-04-18",
  },
  {
    id: "2026-w16-branding-assets",
    title: "Upload brand logos and favicons",
    description:
      "Add your project's real logos, wordmarks, and favicons in a new Branding tab. AI-generated variants reference them via data-brand-logo attributes that resolve to your uploaded files, so mocks carry your actual identity rather than placeholder marks.",
    product: "studio",
    category: "new",
    date: "2026-04-18",
  },
  {
    id: "2026-w16-context-docs",
    title: "Attach project context documents",
    description:
      "Upload brand voice docs, copy guidelines, or product descriptions in the new Context tab. Every variant generation includes them alongside your design tokens automatically. Claude treats tokens as truth and context docs as wording and tone input.",
    product: "studio",
    category: "new",
    date: "2026-04-18",
  },
  {
    id: "2026-w16-fresh-layout-md",
    title: "Layout.md edits always reach AI generation",
    description:
      "Editing layout.md in Monaco and immediately clicking Generate no longer races saves. The explore route fetches the latest saved copy server-side before building the prompt. A new banner also surfaces when a manual layout.md section drifts from your extracted tokens.",
    product: "studio",
    category: "fixed",
    date: "2026-04-18",
  },
  {
    id: "2026-w16-add-tokens",
    title: "Add tokens manually",
    description:
      "Missed a colour, spacing, or radius value during extraction? Click the new + button in the Source Panel or Design System page to add tokens directly. New tokens sync to layout.md and export bundles automatically.",
    product: "studio",
    category: "new",
    date: "2026-04-17",
  },
  {
    id: "2026-w16-custom-hex-persistence",
    title: "Custom colours now persist",
    description:
      "When you enter a custom hex in the Design System role assignment popover, the token is now saved to your design system. Previously, custom colours were lost on refresh.",
    product: "studio",
    category: "fixed",
    date: "2026-04-17",
  },
  {
    id: "2026-w16-token-delete-sync",
    title: "Deleting tokens updates layout.md",
    description:
      "Removing a token from the Source Panel or Design System page now removes it from layout.md too. No more stale token references for AI agents to trip over.",
    product: "studio",
    category: "fixed",
    date: "2026-04-17",
  },
  {
    id: "2026-w16-theme-switching",
    title: "Light, dark, and system theme",
    description:
      "Switch between light mode, dark mode, or follow your system preference. The entire Studio UI adapts, including modals, dropdowns, and variant previews.",
    product: "studio",
    category: "new",
    date: "2026-04-12",
  },
  {
    id: "2026-w16-forgot-password",
    title: "Forgot password flow",
    description:
      "Reset your password via email if you forget it. Click 'Forgot password?' on the login page to receive a reset link.",
    product: "studio",
    category: "new",
    date: "2026-04-10",
  },
  {
    id: "2026-w16-workspace-switcher",
    title: "Improved workspace switcher",
    description:
      "The sidebar workspace switcher now shows your organisation and project name stacked for clarity. Create new projects directly from the switcher dropdown.",
    product: "studio",
    category: "improved",
    date: "2026-04-12",
  },
  {
    id: "2026-w16-design-system-page-improvements",
    title: "Better Design System page",
    description:
      "Token categorisation, grouping, and previews are now more accurate. Spacing and effect tokens display correctly, and the view is preserved when switching projects.",
    product: "studio",
    category: "improved",
    date: "2026-04-12",
  },
  {
    id: "2026-w16-image-generation-reliability",
    title: "More reliable AI image generation",
    description:
      "Fixed several issues where generated images would show broken URLs or disappear on re-generation. Avatar placeholders and batch image generation now work reliably.",
    product: "studio",
    category: "fixed",
    date: "2026-04-13",
  },
  {
    id: "2026-w16-inspector-fixes",
    title: "Inspector style edits now target the correct element",
    description:
      "Fixed an issue where Inspector edits could apply styles to the wrong element. Edits now reliably target exactly what you selected.",
    product: "studio",
    category: "fixed",
    date: "2026-04-13",
  },
  {
    id: "2026-w16-extraction-css-fix",
    title: "Cleaner CSS token injection",
    description:
      "Extracted design tokens no longer conflict with existing styles in variant previews. Malformed CSS variable names from extractions are now filtered out automatically.",
    product: "studio",
    category: "fixed",
    date: "2026-04-08",
  },
  {
    id: "2026-w16-variant-feedback",
    title: "Rate generated variants",
    description:
      "Thumbs up or down on generated variants to help improve future results. Feedback is logged and visible in the admin dashboard.",
    product: "studio",
    category: "new",
    date: "2026-04-12",
  },
  {
    id: "2026-w16-cancel-extraction",
    title: "Cancel extractions in progress",
    description:
      "Long-running Figma or website extractions can now be cancelled mid-way instead of waiting for them to complete.",
    product: "studio",
    category: "improved",
    date: "2026-04-12",
  },
  {
    id: "2026-w16-preview-hooks-fix",
    title: "Fixed React component previews",
    description:
      "Components using React hooks (useState, useEffect, etc.) now render correctly in variant previews instead of showing errors.",
    product: "studio",
    category: "fixed",
    date: "2026-04-09",
  },
  {
    id: "2026-w16-light-mode-polish",
    title: "Light mode polish",
    description:
      "Improved contrast, softer modal overlays, and consistent colours across the entire UI in light mode.",
    product: "studio",
    category: "improved",
    date: "2026-04-12",
  },
  {
    id: "2026-w17-curated-tokens-reach-ai",
    title: "Curated tokens reliably reach your AI agents",
    description:
      "Curating a role like APP BACKGROUND to pure white used to leave stale tokens in layout.md's Core Tokens block, so AI agents kept generating off-brand UI. Every MCP, Explorer, and export read now regenerates that block from your curated assignments, so what Claude sees always matches what you chose.",
    product: "studio",
    category: "fixed",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-curated-count-label",
    title: "Clearer role count on the Curated page",
    description:
      "Section headers now read \"BACKGROUNDS 3 of 6 roles\" instead of the cryptic \"BACKGROUNDS 3 3/6\". Same data, no maths required.",
    product: "studio",
    category: "improved",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-icon-packs-persist",
    title: "Selected icon packs now persist",
    description:
      "Picking icon packs in the Source Panel worked in the session but disappeared on reload. Selections now save to the server and come back when you return to the project.",
    product: "studio",
    category: "fixed",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-snapshots-persist",
    title: "Design system snapshots survive reloads",
    description:
      "Snapshots taken from the Curated view used to live only in your current browser session and vanished on refresh. They are now stored server-side, so rollbacks work after closing the tab or coming back the next day.",
    product: "studio",
    category: "fixed",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-exported-layout-matches",
    title: "Exported layout.md matches what your agents see",
    description:
      "The layout.md in exported ZIPs is now the exact document MCP and the Explorer read, with curated Core Tokens and the full token reference appendix regenerated from your latest design system. No more drift between what you exported to Cursor or Windsurf and what the Explorer used for variants.",
    product: "studio",
    category: "improved",
    date: "2026-04-20",
  },
];

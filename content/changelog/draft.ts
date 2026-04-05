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
  {
    id: "2026-w14-design-system-page",
    title: "Visual design system reference page",
    description:
      "New Design System page in the sidebar shows your extracted tokens as a visual reference: colour palettes with grouped swatches, typography specimens, spacing scale bars, radius previews, and shadow cards. Edit any token inline and changes sync to your layout.md.",
    product: "studio",
    category: "new",
    date: "2026-04-04",
  },
  {
    id: "2026-w14-figma-embed-tab",
    title: "Live Figma preview in Studio",
    description:
      "New Figma tab in the source panel shows a live, interactive embed of your Figma file alongside the editor. Auto-loads from your extraction source, or paste any Figma URL.",
    product: "studio",
    category: "new",
    date: "2026-04-04",
  },
  {
    id: "2026-w14-native-push-mode",
    title: "Push to Figma as editable objects",
    description:
      "New 'Native' push mode creates real, editable Figma frames with auto-layout, proper text nodes, and colour fills. No more flat screenshots. Toggle between Native and Capture in the push modal.",
    product: "studio",
    category: "improved",
    date: "2026-04-04",
  },
  {
    id: "2026-w14-extraction-improvements",
    title: "More accurate design system extraction",
    description:
      "Gradients, Figma Variables (spacing, radius, strings), strokes/borders, motion tokens, and semi-transparent colours now extracted correctly. Website extraction samples 24 element types (was 10). Component limit raised to 100, style limit to 500.",
    product: "studio",
    category: "improved",
    date: "2026-04-04",
  },
  {
    id: "2026-w14-push-tokens-to-figma",
    title: "Push design tokens to Figma",
    description:
      "New MCP tool pushes your extracted design tokens to Figma as native variables and styles. Colours become Figma colour variables, spacing becomes number variables, typography becomes text styles.",
    product: "cli",
    category: "new",
    date: "2026-04-04",
  },
  {
    id: "2026-w14-auto-fix-figma-mcp",
    title: "Auto-fix Figma MCP setup",
    description:
      "The Layout MCP server now detects outdated or misconfigured Figma MCP installations on startup and fixes them automatically. No more manual 'claude mcp add' commands.",
    product: "cli",
    category: "improved",
    date: "2026-04-04",
  },
  {
    id: "2026-w14-sidebar-nav-restructure",
    title: "Cleaner sidebar navigation",
    description:
      "Editor, Explore, Design System, and Saved are now separate sidebar items instead of being split between the sidebar and a top bar toggle. Easier to find, easier to switch.",
    product: "studio",
    category: "improved",
    date: "2026-04-04",
  },
  {
    id: "2026-w14-shimmer-skeletons",
    title: "Better loading experience for variant generation",
    description:
      "Replaced static spinners with animated shimmer skeletons that hint at the UI structure being generated. Cards stay in place throughout generation instead of jumping between rows.",
    product: "studio",
    category: "improved",
    date: "2026-04-04",
  },
  {
    id: "2026-w14-variant-reveal-animation",
    title: "Smooth reveal animation for generated variants",
    description:
      "Completed variants now reveal with a top-down wipe animation instead of appearing instantly, creating a satisfying 'painting on' effect.",
    product: "studio",
    category: "improved",
    date: "2026-04-04",
  },
  {
    id: "2026-w14-feedback-link",
    title: "Feedback link in sidebar",
    description:
      "New feedback button in the sidebar with options to email us or join the Discord community.",
    product: "studio",
    category: "new",
    date: "2026-04-05",
  },
  {
    id: "2026-w14-default-explorer",
    title: "Explorer is now the default view",
    description:
      "Opening a project now lands you in the Explorer instead of the Editor, since that is where most users spend their time.",
    product: "studio",
    category: "improved",
    date: "2026-04-05",
  },
  {
    id: "2026-w14-docs-fixes",
    title: "Documentation updates",
    description:
      "Data & Privacy page now live. Updated competitor comparison, API reference, and integration guides with latest tool counts and corrected information.",
    product: "studio",
    category: "fixed",
    date: "2026-04-05",
  },
  {
    id: "2026-w14-custom-fonts",
    title: "Custom font support",
    description:
      "Upload custom font files (.woff2, .woff, .ttf, .otf) for your design system. Google Fonts are auto-detected from extractions. Both are injected into Explorer variant previews and included in export bundles.",
    product: "studio",
    category: "new",
    date: "2026-04-05",
  },
  {
    id: "2026-w14-plugin-token-sync",
    title: "Live token sync from Figma plugin",
    description:
      "When the Figma plugin pushes Variables to Layout, the Studio detects the update and prompts you to regenerate layout.md with a single click.",
    product: "studio",
    category: "new",
    date: "2026-04-05",
  },
  {
    id: "2026-w14-plugin-explore-rename",
    title: "Canvas renamed to Explore",
    description:
      "The Canvas tab in the Figma plugin and the Explorer empty state in the Studio now use consistent naming.",
    product: "figma-plugin",
    category: "improved",
    date: "2026-04-05",
  },
  {
    id: "2026-w14-plugin-variables-fix",
    title: "Variables API works on all Figma plans",
    description:
      "Removed the Enterprise-only restriction for the Variables API. Token extraction now works on all Figma plans.",
    product: "figma-plugin",
    category: "fixed",
    date: "2026-04-04",
  },
  {
    id: "2026-w14-plugin-new-project",
    title: "Create new projects from the plugin",
    description:
      "New project button in the plugin header lets you create a Layout project without leaving Figma.",
    product: "figma-plugin",
    category: "new",
    date: "2026-04-04",
  },
  {
    id: "2026-w14-plugin-extraction-perf",
    title: "Faster, safer token extraction",
    description:
      "Token extraction now has a depth limit to prevent freezing on deeply nested files, and scans the current page instead of the entire document.",
    product: "figma-plugin",
    category: "improved",
    date: "2026-04-05",
  },
  {
    id: "2026-w14-extension-layout-md-rename",
    title: "layout.md support",
    description:
      "The Chrome extension now uses the new layout.md filename, matching the Studio and CLI.",
    product: "chrome-extension",
    category: "improved",
    date: "2026-04-03",
  },
  {
    id: "2026-w14-extension-capture-fix",
    title: "Better full-page screenshots",
    description:
      "Fixed and sticky elements (navbars, cookie banners) are now hidden during full-page capture for cleaner screenshots.",
    product: "chrome-extension",
    category: "fixed",
    date: "2026-04-03",
  },
  {
    id: "2026-w14-extension-org-projects",
    title: "Create projects from the extension",
    description:
      "New project creation from the extension now correctly scopes to your organisation.",
    product: "chrome-extension",
    category: "improved",
    date: "2026-04-04",
  },
];

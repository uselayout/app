import type { ChangelogWeek } from "@/lib/types/changelog";

export const publishedWeeks: ChangelogWeek[] = [
  {
    weekId: "2026-W13",
    label: "Week of 24 March 2026",
    entries: [
      {
        id: "2026-w13-layout-md-rename",
        title: "layout.md replaces DESIGN.md",
        description:
          "Renamed the design system file from DESIGN.md to layout.md across the entire platform for clearer brand identity.",
        product: "studio",
        category: "improved",
        date: "2026-03-20",
      },
      {
        id: "2026-w13-cli-layout-md-rename",
        title: "layout.md support in CLI",
        description:
          "The CLI now reads layout.md by default and auto-migrates existing DESIGN.md files with a friendly notice.",
        product: "cli",
        category: "improved",
        date: "2026-03-20",
      },
    ],
  },
  {
    weekId: "2026-W12",
    label: "Week of 17 March 2026",
    entries: [
      {
        id: "2026-w12-new-project-button",
        title: "New Project button",
        description:
          "Create new projects directly from the projects page with the new extraction modal.",
        product: "studio",
        category: "new",
        date: "2026-03-15",
      },
      {
        id: "2026-w12-ai-component-creation",
        title: "AI-assisted component creation",
        description:
          "Chat with AI in the component creator to generate and edit components using your design system context.",
        product: "studio",
        category: "new",
        date: "2026-03-15",
      },
      {
        id: "2026-w12-cli-serve-local",
        title: "Serve local files for Figma capture",
        description:
          "New serve-local command spins up a local HTTP server so Figma MCP can capture file:// URLs.",
        product: "cli",
        category: "new",
        date: "2026-03-15",
      },
      {
        id: "2026-w12-cli-auto-setup",
        title: "Automatic MCP setup",
        description:
          "The install command now sets up Figma MCP and Playwright MCP automatically alongside Layout.",
        product: "cli",
        category: "improved",
        date: "2026-03-15",
      },
      {
        id: "2026-w12-cli-doctor",
        title: "Doctor command with auto-fix",
        description:
          "Run layout doctor to diagnose setup issues. Add --fix to auto-install missing dependencies.",
        product: "cli",
        category: "new",
        date: "2026-03-13",
      },
    ],
  },
  {
    weekId: "2026-W11",
    label: "Week of 10 March 2026",
    entries: [
      {
        id: "2026-w11-explorer-canvas",
        title: "Explorer Canvas",
        description:
          "Generate 2-6 component variants simultaneously with AI, upload reference images, and refine individual results.",
        product: "studio",
        category: "new",
        date: "2026-03-14",
      },
      {
        id: "2026-w11-promote-to-library",
        title: "Save variants to component library",
        description:
          "Promote any Explorer variant directly to your organisation's component library with one click.",
        product: "studio",
        category: "new",
        date: "2026-03-14",
      },
      {
        id: "2026-w11-quality-scoring",
        title: "Design system quality scoring",
        description:
          "See a 0-100 quality score for your layout.md across 6 categories with actionable suggestions.",
        product: "studio",
        category: "new",
        date: "2026-03-14",
      },
      {
        id: "2026-w11-extraction-diff",
        title: "Extraction diff on re-extract",
        description:
          "When you re-extract, see exactly what changed in your tokens and components before accepting.",
        product: "studio",
        category: "new",
        date: "2026-03-14",
      },
      {
        id: "2026-w11-push-to-figma",
        title: "Push components to Figma",
        description:
          "Send generated components directly to Figma as editable frames with multi-viewport support.",
        product: "cli",
        category: "new",
        date: "2026-03-11",
      },
      {
        id: "2026-w11-design-in-figma",
        title: "Design in Figma with AI",
        description:
          "New MCP tool lets AI agents create Figma mockups using your design system context before writing code.",
        product: "cli",
        category: "new",
        date: "2026-03-11",
      },
      {
        id: "2026-w11-initial-release",
        title: "Layout public launch",
        description:
          "Extract design systems from Figma and websites, generate LLM-optimised context bundles, and ship on-brand UI with any AI coding agent.",
        product: "studio",
        category: "new",
        date: "2026-03-11",
      },
    ],
  },
];

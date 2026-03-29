import type { ChangelogWeek } from "@/lib/types/changelog";

export const publishedWeeks: ChangelogWeek[] = [
  {
    weekId: "2026-W13",
    label: "Week of 24 March 2026",
    summary:
      "Rebranded the design system file to layout.md across the entire platform for clearer brand identity.",
    items: [
      { text: "layout.md replaces DESIGN.md across Studio", product: "studio", category: "improved" },
      { text: "CLI auto-migrates existing DESIGN.md files to layout.md", product: "cli", category: "improved" },
    ],
  },
  {
    weekId: "2026-W12",
    label: "Week of 17 March 2026",
    summary:
      "AI-assisted component creation lands in Studio, and the CLI gets smarter with automatic MCP setup and a new doctor command.",
    items: [
      { text: "New Project button on the projects page", product: "studio", category: "new" },
      { text: "AI-assisted component creation in the component editor", product: "studio", category: "new" },
      { text: "Serve local files for Figma capture via new serve-local command", product: "cli", category: "new" },
      { text: "Automatic Figma MCP and Playwright MCP setup on install", product: "cli", category: "improved" },
      { text: "Doctor command with --fix to auto-install missing dependencies", product: "cli", category: "new" },
    ],
  },
  {
    weekId: "2026-W11",
    label: "Week of 10 March 2026",
    summary:
      "Layout launches. Extract design systems from Figma and websites, generate AI-optimised context bundles, and explore component variants with AI.",
    items: [
      { text: "Explorer Canvas for AI-powered multi-variant generation", product: "studio", category: "new" },
      { text: "Save Explorer variants directly to component library", product: "studio", category: "new" },
      { text: "Design system quality scoring across 6 categories", product: "studio", category: "new" },
      { text: "Extraction diff on re-extract with accept/discard", product: "studio", category: "new" },
      { text: "Website and Figma extraction with Claude synthesis", product: "studio", category: "new" },
      { text: "Push components to Figma as editable frames", product: "cli", category: "new" },
      { text: "Design in Figma with AI using design system context", product: "cli", category: "new" },
    ],
  },
];

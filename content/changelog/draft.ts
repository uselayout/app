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
    id: "2026-w23-gallery-new-default-and-accurate-downloads",
    title: "Gallery opens on New, and download counts are accurate",
    description:
      "The Kit Gallery now opens on the New tab so the latest kits are front and centre. Download counts are also more honest: importing a kit you published yourself no longer counts as a download, so freshly posted kits start at zero instead of looking like they already have traffic.",
    product: "studio",
    category: "improved",
    date: "2026-06-03",
  },
  {
    id: "2026-w23-layout-live-download",
    title: "Layout Live is now available to download",
    description:
      "Layout Live, the macOS app for visually editing your running React app, is now a free open download. Click an element in your live app, scrub its spacing, swap a colour for a design token, and the change is written straight back to your source as a Tailwind class. No cloud sandbox, no AI tokens spent. It is signed and notarised by Apple, so it opens with a plain double-click, and it updates itself automatically as we ship fixes. Grab it from the new Layout Live page.",
    product: "live",
    category: "new",
    date: "2026-06-03",
  },
  {
    id: "2026-w23-docs-layout-live",
    title: "Docs now cover Layout Live, plus the latest CLI and MCP tools",
    description:
      "The documentation has a new Layout Live section: an overview of the desktop app that lets you tweak your running React app visually (click an element, scrub padding, swap a token, write straight back to source), and a full Gallery to Live round trip that walks from importing a kit all the way to handing the result off to Claude Code. The CLI and MCP page now documents the install --live flag and the four new Live MCP tools (get-selected-element, get-recent-visual-edits, lock-file, unlock-file), and the docs introduction lists Layout Live alongside the rest of the product family.",
    product: "studio",
    category: "new",
    date: "2026-06-02",
  },
  {
    id: "2026-w23-gallery-sort-by-downloads",
    title: "Gallery Top, Featured and New sorts now actually reorder kits",
    description:
      "The Featured, Top and New tabs on the Kit Gallery barely changed the order when you clicked between them. Top now sorts by downloads (most-imported kits first) instead of upvotes, Featured surfaces featured kits then ranks the rest by downloads, and New leads with the newest and any New-badged kits. The three tabs now produce genuinely different orderings.",
    product: "studio",
    category: "fixed",
    date: "2026-06-02",
  },
  {
    id: "2026-w23-gallery-kit-mobile",
    title: "Kit gallery design-system view now works on mobile",
    description:
      "On phones, a kit's Design system reference was crushed into a tiny column next to the navigation, making it unreadable. The side navigation now collapses into a horizontal, swipeable bar pinned to the top, and the content fills the full width below it. Tapping a section jumps to it and the active section stays highlighted as you scroll.",
    product: "studio",
    category: "fixed",
    date: "2026-06-02",
  },
  {
    id: "2026-w23-gallery-bespoke-brand-skins",
    title: "Gallery kits now match each brand's real UI",
    description:
      "Every kit page in the Gallery is now a navigable design-system reference, not a single scroll. A left-hand menu groups Foundations (colour, typography, spacing, sizes, radius, elevation, icons), Forms (text fields, dropdowns, checkboxes, switches, field states) and Components (buttons, badges, avatars, tabs, tooltips, alerts, accordion, breadcrumb, pagination, stats, cards, tables), and clicking any item jumps straight to it. Best of all, each kit is now styled to look like its actual brand: Stripe's shadowed buttons, Netflix's dark red UI, IBM's sharp Carbon look, right down to the copy, so the showcase feels like the real product rather than a generic template. See exactly how a kit's buttons, inputs and components behave before you import it.",
    product: "studio",
    category: "improved",
    date: "2026-06-01",
  },
  {
    id: "2026-w23-gallery-design-system-reference",
    title: "Gallery kits now open as a full design-system reference",
    description:
      "Every kit page in the Gallery is now a navigable design-system reference, not a single scroll. A left-hand menu groups Foundations (colour, typography, spacing, sizes, radius, elevation, icons), Forms (text fields, dropdowns, checkboxes, switches, field states) and Components (buttons, badges, avatars, tabs, tooltips, alerts, accordion, breadcrumb, pagination, stats, cards, tables), and clicking any item jumps straight to it. Everything renders live in each kit's own tokens, so you can see exactly how a kit's buttons, inputs and colours look before importing it. Works automatically for every current and future kit.",
    product: "studio",
    category: "improved",
    date: "2026-06-01",
  },
  {
    id: "2026-w23-cli-install-gallery-kit",
    title: "Install any gallery kit straight from the CLI",
    description:
      "You can now pull a community kit into your project with a single command. Copy the install command from any kit's Gallery page (npx @layoutdesign/context install <kit-slug>, or use <kit-slug>) and Layout downloads that kit's layout.md, tokens and manifest into .layout/, ready for your AI agent. Previously only the three bundled starter kits worked from the CLI; every published gallery kit now does.",
    product: "cli",
    category: "new",
    date: "2026-06-01",
  },
  {
    id: "2026-w23-kits-include-components",
    title: "Share component code with your kits",
    description:
      "When you publish a project to the Gallery, you can now include its components. The Share dialog has a new Components toggle that shows how many you have saved, and ticks itself on when there are any. Anyone who imports the kit, into Studio or via the CLI, gets the component code alongside the tokens, so their AI agent can reuse your real components instead of guessing.",
    product: "studio",
    category: "new",
    date: "2026-06-01",
  },
  {
    id: "2026-w20-generate-and-refine-charge-credits",
    title: "Generate code and Refine with AI now consume credits properly",
    description:
      "The Generate code and Refine with AI buttons in the component inspector were calling Claude with no quota check and no credit deduction — a billing leak that affected anyone on the hosted plan. Both now charge one credit per call (refunded automatically if the generation fails), honour your BYOK Anthropic key when one is in Settings, and return a clear \"No credits remaining\" message when you're out instead of a generic error.",
    product: "studio",
    category: "fixed",
    date: "2026-05-11",
  },
  {
    id: "2026-w19-homepage-interactive-mocks",
    title: "Marketing homepage replaces every video with an interactive Studio mock",
    description:
      "The layout.design homepage no longer ships any product videos. Every section — extraction, design-system page, layout.md editor, Explorer, MCP serve, Chrome extension, Figma plugin, Push to Paper, the Studio frame itself — is now an interactive mock built from the real Studio chrome. Mock buttons have rollover tooltips. The hero is a 4-view switcher cycling through the actual surfaces of Layout. Loads roughly 10x faster than the old video set and lets you read code, hover compliance scores, and explore the IDE+terminal split view without leaving the page.",
    product: "studio",
    category: "improved",
    date: "2026-05-03",
  },
];

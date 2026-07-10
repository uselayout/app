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
    id: "2026-w28-live-wrong-folder-recovery",
    title: "Opened the wrong folder? Live now fixes it in one click",
    description:
      "If you open a folder that is not quite your app, like the parent of a nested project, Layout Live now notices and offers the right folder before anything goes wrong. If a mismatch still slips through, a banner names both folders and one click reopens the correct one. Error messages across the open-project flow were rewritten in plain English with buttons instead of terminal commands.",
    product: "live",
    category: "improved",
    date: "2026-07-10",
  },
  {
    id: "2026-w28-live-team-sync",
    title: "Share your Live requests with the whole team",
    description:
      "Layout Live can now sync pinned AI requests to your organisation's shared cloud queue. Teammates' requests appear in a Team section of the Requests panel, ready to adopt into your own queue, and when someone marks your request done your pins update automatically. A new Live Requests page in the Studio dashboard shows the whole team's queue grouped by project. Set it up in Live's Settings with your organisation API key; it is off by default and your key never leaves your machine.",
    product: "live",
    category: "new",
    date: "2026-07-10",
  },
  {
    id: "2026-w28-live-drag-reorder",
    title: "Drag to reorder elements on the canvas",
    description:
      "Grab the grip on the selection toolbar and drag an element to a new position among its siblings. A drop indicator shows exactly where it will land, the page scrolls as you near the edge, and Escape cancels. Every drop is applied as precise, individually undoable edits to your source, in both HTML and React projects.",
    product: "live",
    category: "new",
    date: "2026-07-10",
  },
  {
    id: "2026-w28-live-design-tab-views",
    title: "Browse components and guidelines inside Layout Live",
    description:
      "The Design tab now covers your whole design system: alongside tokens there is a Components view with your full inventory and copyable code for each component, and a Guidelines view that renders your layout.md sections readably with per-section copy. Everything your design system defines is now in the app while you work.",
    product: "live",
    category: "new",
    date: "2026-07-10",
  },
  {
    id: "2026-w28-live-reliability-sweep-2",
    title: "A deep reliability pass across Live and the CLI",
    description:
      "A full review of recent releases fixed a set of subtle issues before most users hit them: undoing a move now keeps your selection on the right element, token previews always clear if a save fails, the compliance meter works in every project layout, translucent colours no longer get misleading token suggestions, dark-mode tokens are classified correctly everywhere, and the CI check command now handles monorepos properly.",
    product: "live",
    category: "fixed",
    date: "2026-07-10",
  },
  {
    id: "2026-w28-cli-ci-compliance-gate",
    title: "Gate pull requests on design-system compliance",
    description:
      "A new check command runs your design system's compliance rules across your UI code and fails the build when it finds violations. Add npx @layoutdesign/context check --ci to a GitHub Actions step and every pull request gets inline annotations pointing at hardcoded colours, off-scale spacing and unknown tokens, with the nearest token suggested. Use --changed to scan only the files a pull request touches. Enforcement now holds even when the desktop app is closed.",
    product: "cli",
    category: "new",
    date: "2026-07-09",
  },
  {
    id: "2026-w28-live-selection-toolbar",
    title: "A floating toolbar on every element you select",
    description:
      "Selecting an element in Layout Live now shows a compact toolbar right on the canvas: edit its text, ask the AI to change it, or move it up and down among its siblings, without hunting through side panels. Hold Alt and scroll to walk up to a parent element, with a breadcrumb showing where you are. Repeated tweaks to the same property now collapse into a single, tidy entry in the Edits panel.",
    product: "live",
    category: "improved",
    date: "2026-07-09",
  },
  {
    id: "2026-w28-live-jsx-reordering",
    title: "Reorder React elements, not just HTML",
    description:
      "Move up and move down now work on React and Next.js pages, not only plain HTML. Select an element and reorder it among its siblings with the Position controls or Alt+Up / Alt+Down, and Layout Live rewrites just the moved lines in your source. It steps aside safely around dynamic content like conditionals and mapped lists, telling you to ask the AI instead when a move is not a clean swap.",
    product: "live",
    category: "improved",
    date: "2026-07-09",
  },
  {
    id: "2026-w28-live-team-webhook",
    title: "Send AI requests to your team's Slack or Discord",
    description:
      "Layout Live can now post every request you pin to a Slack, Discord or generic webhook, so design requests land in a shared channel and the whole team can see what has been flagged. It is off by default and set up in Settings, with a Send test button to check it works. Your webhook URL stays on your machine and is never committed to your repo.",
    product: "live",
    category: "new",
    date: "2026-07-09",
  },
  {
    id: "2026-w28-live-compliance-quick-fix",
    title: "Fix design-system violations with one click",
    description:
      "The compliance meter now expands into a proper violations list: each issue shows its rule, line and the offending value, with the nearest design token suggested alongside a swatch. When the violation is on the element you have selected, a Fix button applies the token through the normal edit pipeline and the score climbs as you watch. Anything ambiguous gets an Ask AI button that files a ready-written request for your agent instead.",
    product: "live",
    category: "new",
    date: "2026-07-08",
  },
  {
    id: "2026-w28-live-token-editing",
    title: "Edit design tokens in Layout Live with instant preview",
    description:
      "The Design tab is no longer read-only. Hover any token and click the pencil to edit it, and the running page previews the new value instantly, before you save. Saving writes the change through to your tokens.css, tokens.json and layout.md, appears in the Edits panel, and can be undone like any other edit. Light and dark values are edited separately, so changing one never overwrites the other.",
    product: "live",
    category: "new",
    date: "2026-07-08",
  },
  {
    id: "2026-w28-live-request-screenshots",
    title: "Requests now carry a screenshot for your agent",
    description:
      "When you pin a request in Layout Live, the app captures a screenshot of the page at that moment and stores it alongside the request. Your coding agent can view it with the new get-live-screenshot tool, so \"make it look like this\" finally comes with pixels attached. Region requests are cropped to the area you drew.",
    product: "live",
    category: "new",
    date: "2026-07-08",
  },
  {
    id: "2026-w28-cli-dark-mode-token-safety",
    title: "Token updates no longer overwrite dark-mode values",
    description:
      "The update-tokens tool previously replaced a token everywhere it appeared, including inside your dark-theme block, silently flattening dark mode. Updates are now mode-aware: light edits touch only the base values, dark edits touch only the dark block, and agents can still opt into updating both.",
    product: "cli",
    category: "fixed",
    date: "2026-07-08",
  },
  {
    id: "2026-w28-live-agent-status",
    title: "Your AI agent now reports back in Layout Live",
    description:
      "The request loop is closed: when a coding agent picks up one of your pinned requests it can mark it in progress, and when it finishes, the pin and panel entry turn green with a note about what was done. Pins recolour on the page as work happens (amber waiting, blue in progress), so you always know what's queued, what's moving and what's finished without leaving Live.",
    product: "live",
    category: "new",
    date: "2026-07-08",
  },
  {
    id: "2026-w28-live-design-tab",
    title: "Browse your design system inside Layout Live",
    description:
      "A new Design tab shows your design system without switching to Studio: colour swatches with light and dark values side by side, font specimens, and your spacing, radius and shadow scales. Click any token to copy its variable name. It refreshes automatically when your tokens change, and works in a reduced form even before the CLI is installed.",
    product: "live",
    category: "new",
    date: "2026-07-08",
  },
  {
    id: "2026-w28-live-move-elements",
    title: "Move elements up and down on HTML pages",
    description:
      "Reorder sections and elements without touching code: select an element on a plain HTML page and use the new Position controls or Alt+Up / Alt+Down to move it among its siblings. Layout Live rewrites just the moved lines in your source file, keeps every other edit and pinned request pointing at the right place, and each move can be undone like any other edit. For React elements, a one-click prompt hands the move to your AI agent instead.",
    product: "live",
    category: "new",
    date: "2026-07-08",
  },
  {
    id: "2026-w28-live-token-compliance-fix",
    title: "Token edits and compliance scores now work reliably",
    description:
      "Editing a token from the colour editor now writes the change through to your tokens files correctly, and the compliance meter reads real results from your design system's rules instead of showing unavailable. Failures now surface a clear message rather than silently doing nothing.",
    product: "live",
    category: "fixed",
    date: "2026-07-08",
  },
  {
    id: "2026-w28-cli-agent-request-tools",
    title: "New agent tools: mark-request and list-tokens",
    description:
      "Two new MCP tools for coding agents. mark-request lets your agent report progress on requests you pinned in Layout Live, updating the pins in the app as it works. list-tokens returns your design tokens as a structured catalogue, grouped by colour, typography, spacing, radius and shadow, with dark-mode values tagged, which also powers Layout Live's new Design tab.",
    product: "cli",
    category: "new",
    date: "2026-07-08",
  },
  {
    id: "2026-w28-cli-export-agent-formats",
    title: "Export your design system to any agent format",
    description:
      "The new export command turns your imported design system into the context file your agent expects: CLAUDE.md for Claude Code, AGENTS.md for Codex and compatible agents, .cursor rules for Cursor, or Google's design.md format. Fresh installs now create the right agent files for your tools automatically, so your design system is in front of your agent from the first prompt.",
    product: "cli",
    category: "new",
    date: "2026-07-07",
  },
  {
    id: "2026-w28-kits-shadcn-registry",
    title: "Install kits with the shadcn CLI",
    description:
      "Kits can now be installed straight from the shadcn CLI. Copy one npx shadcn add command from a kit's gallery page and you get the full kit: design tokens wired into your CSS and the .layout context files that let your AI agent follow the system. No Layout account needed.",
    product: "cli",
    category: "new",
    date: "2026-07-07",
  },
  {
    id: "2026-w28-team-first-pricing",
    title: "Clearer pricing built around teams",
    description:
      "The pricing page now leads with the Team plan: org-wide design systems, seat management and compliance reporting in one place, so it's obvious what you get when your whole team ships UI with AI agents. New FAQs spell out how Layout's unmetered local context compares with per-call alternatives, and what enforcement adds on top of context.",
    product: "studio",
    category: "improved",
    date: "2026-07-07",
  },
  {
    id: "2026-w28-serve-to-agent-flow",
    title: "A clearer path from extraction to your agent",
    description:
      "After an extraction finishes, the primary action is now \"Serve to your agent\": it opens the Connect tab with the exact commands to get your design system in front of Claude Code, Cursor or Codex. The Studio also opens on the layout.md editor by default, and a small golden-path checklist in the Connect tab tracks your setup: export, install the CLI, download Layout Live, make your first gated edit.",
    product: "studio",
    category: "improved",
    date: "2026-07-07",
  },
  {
    id: "2026-w28-export-design-md-codex-skill",
    title: "Export DESIGN.md and Codex skill formats",
    description:
      "Two new export formats join the bundle. DESIGN.md emits your design system in Google's design.md format for agents that follow that spec, and Codex skill packages it as an Agent Skill folder (.codex/skills) that OpenAI Codex loads on demand. The export dialog now groups formats into agent context and token formats, and only includes what you select. layout.md is always in the bundle.",
    product: "studio",
    category: "new",
    date: "2026-07-07",
  },
  {
    id: "2026-w28-compliance-in-studio",
    title: "Check any code against your design system in Studio",
    description:
      "The Quality tab has a new \"Check code\" section: paste a snippet and Layout runs the same compliance rules as the CLI's check-compliance tool against your project's tokens and components, with rule-level findings and line numbers. Explorer variant scores are now labelled Compliance, and clicking the badge shows exactly which rules passed or failed.",
    product: "studio",
    category: "new",
    date: "2026-07-07",
  },
  {
    id: "2026-w27-gallery-kit-themes",
    title: "Install any gallery kit as a ready-made UI theme",
    description:
      "Every kit in the gallery now compiles into an installable component theme. Copy one command from the kit page and your shadcn or Layout UI project reskins to match that brand: colours, radius, dark mode and all. Themes are served live, so they always reflect the latest version of the kit.",
    product: "studio",
    category: "new",
    date: "2026-07-03",
  },
  {
    id: "2026-w27-cli-add-components",
    title: "Install Layout UI components from the CLI",
    description:
      "The new add command installs components from the Layout UI registry into any React project: npx @layoutdesign/context add button. It resolves dependencies, installs any packages your project is missing, and sets up the theme automatically on first use. Works with npm, pnpm, yarn and bun.",
    product: "cli",
    category: "new",
    date: "2026-07-03",
  },
  {
    id: "2026-w27-live-request-pins",
    title: "See your AI requests pinned on the page",
    description:
      "Requests you pin with \"Ask the AI\" now stay visible as small amber markers on the page, so you can see at a glance what you've asked and where. Click a marker to jump to that request in the panel, and the hand-off badge now counts pending requests too.",
    product: "live",
    category: "new",
    date: "2026-07-02",
  },
  {
    id: "2026-w27-live-shortcuts-window",
    title: "Keyboard shortcuts and a window that remembers itself",
    description:
      "Layout Live now opens at the size and position you left it, instead of resetting every launch. New shortcuts speed up the daily loop: Cmd+E toggles Edit and View, Cmd+Shift+C toggles comment mode, Cmd+Shift+H opens hand-off, and Cmd+3/4/5 switch between desktop, tablet and mobile viewports.",
    product: "live",
    category: "improved",
    date: "2026-07-02",
  },
  {
    id: "2026-w27-live-reliability-sweep",
    title: "A more dependable editing session",
    description:
      "A wide reliability sweep across Layout Live: rapid edits to the same file can no longer overwrite each other, \"this instance only\" stays selected while you scrub, clearing a number field no longer collapses the element to zero, comment pins no longer also select the element underneath, and switching projects now fully resets banners, requests and undo state. Live also keeps working (with edits saved to disk for your AI agent) even if its connection socket can't start.",
    product: "live",
    category: "fixed",
    date: "2026-07-02",
  },
  {
    id: "2026-w27-live-preview-connection-states",
    title: "See what the preview is doing while it connects",
    description:
      "The preview area now tells you where things stand instead of sitting blank: while Layout Live searches for your dev server it shows which ports it's trying, and if nothing answers you get a clear message with a Retry button. A new status dot next to the address bar shows the connection at a glance: pulsing while searching, green when connected, red when no server was found.",
    product: "live",
    category: "improved",
    date: "2026-07-02",
  },
  {
    id: "2026-w27-live-plain-html-editing",
    title: "Edit plain HTML sites in Layout Live",
    description:
      "Layout Live now works on plain HTML projects, with no build plugin needed. Open a folder of .html files, point Live at your local server, and every element becomes editable: click to inspect, adjust spacing and colours, edit text inline, and swap images. Ideal for landing pages and static sites that don't use React.",
    product: "live",
    category: "new",
    date: "2026-07-02",
  },
  {
    id: "2026-w26-gallery-readable-previews",
    title: "Clearer kit previews for bold, colourful brands",
    description:
      "Kit previews in the Gallery now stay readable when a kit's brand colour is a strong blue, green, or pink. Headings and body text no longer wash out on coloured panels, so every kit shows its real palette without losing legibility.",
    product: "studio",
    category: "fixed",
    date: "2026-06-26",
  },
  {
    id: "2026-w26-gallery-mobile-scroll",
    title: "Scroll past the kit preview on mobile",
    description:
      "On phones you can now scroll all the way down a kit page to the \"You may also like\" section. The live preview no longer traps the scroll, so the rest of the page is reachable.",
    product: "studio",
    category: "fixed",
    date: "2026-06-26",
  },
  {
    id: "2026-w26-extract-limits",
    title: "More extractions per hour, clearer limits",
    description:
      "You can now run more website and Figma extractions per hour. And if you do hit the limit, Studio tells you clearly and shows when you can try again, instead of failing quietly.",
    product: "studio",
    category: "improved",
    date: "2026-06-26",
  },
  {
    id: "2026-w25-live-plugin-update-banner",
    title: "One-click updates when your plugin is out of date",
    description:
      "Layout Live now tells you when your project's Layout plugin is behind the latest release, with a one-click update. Since the plugin version controls which elements can be edited, this keeps you from getting stuck on \"why isn't this editable\" with no idea an update would fix it.",
    product: "live",
    category: "new",
    date: "2026-06-18",
  },
  {
    id: "2026-w25-cli-update-notice",
    title: "Heads-up when a newer version is available",
    description:
      "The CLI now lets you know when a newer @layoutdesign/context is published, with the exact command to update. Checked quietly in the background (once a day) and easy to turn off.",
    product: "cli",
    category: "improved",
    date: "2026-06-18",
  },
  {
    id: "2026-w25-live-motion-text",
    title: "Edit text in animated (Framer Motion) headings",
    description:
      "Headings and paragraphs built with Framer Motion (motion.h1, motion.p, etc) are now selectable and editable in Layout Live, and show up in the layers tree. Previously clicking them selected the surrounding container instead.",
    product: "live",
    category: "fixed",
    date: "2026-06-18",
  },
  {
    id: "2026-w25-live-edit-card-grid-text",
    title: "Edit text in repeated cards and lists",
    description:
      "Headings and body text in feature grids, pricing tables and other repeated cards are now editable in Layout Live, even when the text comes from a data array in your code. Click a card's text, change it, and only that card updates.",
    product: "live",
    category: "new",
    date: "2026-06-18",
  },
  {
    id: "2026-w25-live-select-under-overlays",
    title: "Click text hidden behind overlays",
    description:
      "When a decorative layer (a gradient, glow, or floating particles) sat on top of your text, clicking would select the overlay instead. Layout Live now reaches the text you actually clicked.",
    product: "live",
    category: "improved",
    date: "2026-06-18",
  },
  {
    id: "2026-w25-live-next14-editing",
    title: "Visual editing now works on Next.js 14 apps",
    description:
      "Layout Live can now make elements editable in Next.js 14 App Router projects, not just Next 15 and 16. Set up editing, restart your dev server, and click any element to tweak its spacing, colour or text.",
    product: "live",
    category: "new",
    date: "2026-06-18",
  },
  {
    id: "2026-w25-live-check-now-feedback",
    title: "Clearer feedback when editing won't turn on",
    description:
      "If Layout Live still can't find any editable elements after you click \"Check now\", it now tells you what to look at, like the wrong dev server, a missed restart, or an unsupported framework version, instead of looking like nothing happened.",
    product: "live",
    category: "improved",
    date: "2026-06-18",
  },
  {
    id: "2026-w25-cli-setup-diagnostics",
    title: "Clearer setup checks for editing and Cursor",
    description:
      "Setup checks now spot when your Next.js version can't be made editable yet and tell you which versions work, and installing now reliably configures Cursor (not just Claude Code) and shows you exactly which tools were set up.",
    product: "cli",
    category: "improved",
    date: "2026-06-18",
  },
  {
    id: "2026-w25-onboarding-live-gallery",
    title: "Discover Layout Live and the kit gallery from your checklist",
    description:
      "The getting-started checklist now points you to two more ways to use Layout: try Layout Live to edit your running app visually, and browse the kit gallery to import a ready-made design system in a click. Both are optional, so your core setup steps stay front and centre.",
    product: "studio",
    category: "improved",
    date: "2026-06-17",
  },
  {
    id: "2026-w25-live-autodetect-restart",
    title: "Editing turns on by itself after you restart",
    description:
      "Once you set up editing for a project, Layout Live now watches for your dev server to come back and switches editing on automatically, with a quick confirmation. No more clicking \"I've restarted\" and wondering if it worked. The manual check is still there if you want it.",
    product: "live",
    category: "improved",
    date: "2026-06-17",
  },
  {
    id: "2026-w25-cli-live-editing-readiness",
    title: "Clearer setup when editing isn't working in Layout Live",
    description:
      "Connecting your AI agent and making your app editable in Layout Live are two separate steps, and it wasn't obvious when the second was missing. Now `doctor` checks whether your project is set up for visual editing and tells you exactly how to fix it, `install` points you to the right command when it spots a frontend project, and if you ask your AI agent why editing isn't working it can now see the cause and hand you the one-line fix.",
    product: "cli",
    category: "improved",
    date: "2026-06-17",
  },
  {
    id: "2026-w25-live-setup-editing-deadend",
    title: "Clearer path to editing when a project isn't set up yet",
    description:
      "If you opened a project whose dev server wasn't emitting source tags yet, Layout Live could show a confusing dead-end message instead of the one-click \"Set up editing\" fix, especially right after launching the app. It now reliably offers to set editing up for you, and when you click an element that nothing on the page is mapped to, the properties panel shows the same one-click fix rather than developer-speak about where the component is used.",
    product: "live",
    category: "fixed",
    date: "2026-06-17",
  },
  {
    id: "2026-w25-live-setup-install-path",
    title: "One-click editing setup works when launched from the dock",
    description:
      "Setting up editing on a project could fail with \"Couldn't install @layoutdesign/context\" when you opened Layout Live from the dock or Finder, because the app couldn't find npm on its own. Layout Live now picks up the same tools your terminal uses, so the install runs reliably however you launch the app, and if something does go wrong the banner now tells you what actually failed.",
    product: "live",
    category: "fixed",
    date: "2026-06-16",
  },
  {
    id: "2026-w25-live-devserver-ownership",
    title: "Opens the right dev server when you run several at once",
    description:
      "If you had more than one project's dev server running, Layout Live could open the wrong one, for example showing another project that happened to be on port 3000. It now locks onto the dev server that actually belongs to the project you opened, and only falls back to a remembered address when it can't tell. The wrong remembered address heals itself the next time you open the project.",
    product: "live",
    category: "fixed",
    date: "2026-06-16",
  },
  // Published 11 June 2026 (week 2026-06-11): update opt-in, view-mode nav
  // fix, Figma-style properties panel. The dev-server reconnect entry below
  // shipped in v0.1.14; stays until the next changelog publish.
  {
    id: "2026-w24-live-button-text",
    title: "Edit button labels from the canvas",
    description:
      "Clicking a button rendered by a shared component used to show no editable text, because the words live where the component is used, not where it is defined. Layout Live now follows the trail back to the call site, so the Text section shows the button's label and editing it rewrites the right file. Works for any component that takes its text as children.",
    product: "live",
    category: "new",
    date: "2026-06-12",
  },
  {
    id: "2026-w24-live-update-autocheck",
    title: "Update banner appears automatically",
    description:
      "Layout Live now quietly checks for new versions in the background every few hours and when you return to the app, so the update banner shows up on its own. No more opening Settings to check for updates manually. Downloads still only start when you choose.",
    product: "live",
    category: "improved",
    date: "2026-06-12",
  },
  {
    id: "2026-w24-live-text-fragments",
    title: "Edit text inside mixed content",
    description:
      "Paragraphs and buttons that mix plain text with nested tags like code, bold or links used to refuse inline editing entirely. The Properties panel now shows a Text section with each editable piece of text as its own field, so you can reword around the nested parts without opening your editor. Text that comes from code (like a variable) shows a one-click shortcut to ask the AI to change it instead, and plain containers no longer show the editing notice at all.",
    product: "live",
    category: "new",
    date: "2026-06-12",
  },
  {
    id: "2026-w24-live-undo-redo",
    title: "Undo and redo your visual edits",
    description:
      "Cmd+Z undoes your last visual edit and Cmd+Shift+Z brings it back, with matching buttons in the toolbar. Undo steps back through your edit history one change at a time, and redo restores exactly what you had, including edits made on a tablet or mobile breakpoint.",
    product: "live",
    category: "new",
    date: "2026-06-12",
  },
  {
    id: "2026-w24-live-drag-resize",
    title: "Resize elements by dragging on the canvas",
    description:
      "Select an element and drag the new grips on its right edge, bottom edge or corner to resize it directly in the preview. You see the new size live while you drag, and on release the real width and height land in your source code, snapping to your Tailwind scale and respecting the breakpoint you are editing.",
    product: "live",
    category: "new",
    date: "2026-06-12",
  },
  {
    id: "2026-w24-live-audit-fixes",
    title: "Sharper editing: stray edits, stuck modes and lost text fixed",
    description:
      "A round of polish on the editor internals: adjusting a value and quickly clicking another element no longer applies the change to the wrong element, Cmd+Tabbing away no longer leaves the app stuck in select mode, switching to View mode mid text edit now saves your typing, the compliance score always matches the selected element, and status colours across panels are readable in the light theme.",
    product: "live",
    category: "fixed",
    date: "2026-06-12",
  },
  {
    id: "2026-w24-live-quick-wins",
    title: "Shortcuts help, compliance breakdown and token chips",
    description:
      "A new Keyboard Shortcuts reference lives in the Settings menu. The compliance meter now expands to show per-category scores and anti-patterns so you know exactly where points went. Line height and letter spacing fields offer one-click design token chips like tight, snug and wide.",
    product: "live",
    category: "improved",
    date: "2026-06-12",
  },
  {
    id: "2026-w24-live-project-switch-state",
    title: "Project switching no longer strands the preview or old diffs",
    description:
      "Fixed two bugs when switching project folders: the localhost preview could vanish until restart (a hidden-view flag got stuck during the switch), and the pending-changes review from the previous project stayed open in the new one. Switching folders now restores the preview reliably and starts the new project with a clean slate.",
    product: "live",
    category: "fixed",
    date: "2026-06-12",
  },
  {
    id: "2026-w24-live-devserver-reconnect-fix",
    title: "Switching projects now finds your running dev server",
    description:
      "Fixed a bug where opening a different project folder could leave the preview blank even though your dev server was running: a previously remembered address was blocking the port scan. Layout Live now checks the remembered address is actually alive before using it, and the Refresh button retries the dev server search instead of doing nothing when the preview never connected.",
    product: "live",
    category: "fixed",
    date: "2026-06-11",
  },
  {
    id: "2026-06-11-install-cli-modal-light-theme",
    title: "Install CLI modal readable in light theme",
    description:
      "The Install CLI popup on the homepage now always renders in dark style, fixing unreadable light-grey text for visitors using the light theme. It also shows the current tool count: 19 MCP design tools and 15 CLI commands.",
    product: "studio",
    category: "fixed",
    date: "2026-06-11",
  },
  {
    id: "2026-w24-studio-bot-protected-extraction",
    title: "Extract design systems from bot-protected sites",
    description:
      "Sites behind aggressive bot protection (like adobe.com) used to fail extraction with a connection error. Extraction now automatically retries with a browser profile these sites accept, so protected sites extract just like any other.",
    product: "studio",
    category: "fixed",
    date: "2026-06-12",
  },
  {
    id: "2026-w24-studio-extraction-retry-cancel",
    title: "Retry or cancel a failed extraction",
    description:
      "When an extraction fails, the progress screen now offers Retry and Cancel buttons instead of leaving you stuck. Connection errors also come with clearer guidance on what went wrong.",
    product: "studio",
    category: "improved",
    date: "2026-06-12",
  },
  {
    id: "2026-w24-live-resize-exact-px",
    title: "Drag-to-resize keeps the exact size you dragged",
    description:
      "Resizing an element with the canvas handles used to snap the committed size to the nearest design token, which could shrink a wide element to less than half its dragged size the moment you let go. Resize now writes the exact pixel size you dragged; values genuinely close to a token (like 17px next to 16px) still snap cleanly.",
    product: "live",
    category: "fixed",
    date: "2026-06-12",
  },
  {
    id: "2026-w24-live-inspector-active-states",
    title: "Inspector controls clearly show the current value",
    description:
      "The selected option in segmented controls (text align, style, decoration and friends) is now a solid accent pill instead of a near-invisible fill in light theme, and the preset chips like auto, full and screen plus the line-height and letter-spacing token chips highlight which value is currently applied.",
    product: "live",
    category: "improved",
    date: "2026-06-12",
  },
  {
    id: "2026-w24-live-gitignore-session-state",
    title: "Layout Live no longer commits per-machine session state",
    description:
      "The .layout/live/ folder used to commit runtime files like dev-info.json on every dev-server restart, creating noisy diffs, cross-machine merge conflicts and leaking your local project path into shared history. Layout now ignores everything in that folder by default and keeps only your shareable config.json tracked. Existing projects heal automatically the next time you run the dev server or open Live.",
    product: "live",
    category: "fixed",
    date: "2026-06-15",
  },
  {
    id: "2026-w24-live-inspector-truthful-values",
    title: "Size fields show real pixel values",
    description:
      "Width, height, min/max, inset and translate fields now read Tailwind's spacing grid correctly, so an element sized w-64 shows its true 256px instead of 64. Keyword values like full, auto and screen display as the keyword rather than a misleading 0px. And pressing a keyword preset on a property owned by a CSS rule now explains why it can't apply instead of silently doing nothing.",
    product: "live",
    category: "fixed",
    date: "2026-06-12",
  },
];

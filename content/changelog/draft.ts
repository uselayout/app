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

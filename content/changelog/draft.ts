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
  // Published 11 June 2026 (week 2026-06-11): update opt-in, view-mode nav
  // fix, Figma-style properties panel. The dev-server reconnect entry below
  // shipped in v0.1.14; stays until the next changelog publish.
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
];

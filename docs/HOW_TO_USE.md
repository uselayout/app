# How to Use Layout

Layout extracts design systems from Figma files or live websites and compiles them into an LLM-optimised context bundle. This guide explains how to take that output and use it in your AI coding workflow.

---

## What You Get

When you click **Export** in the Studio, you download a ZIP containing:

| File | Purpose |
|------|---------|
| `layout.md` | Full design system reference (tokens, components, anti-patterns) |
| `CLAUDE.md-section.md` | Drop-in section for your project's `CLAUDE.md` |
| `AGENTS.md` | Context for OpenAI Codex, Jules, Factory, Amp (agents.md standard) |
| `tokens.css` | CSS custom properties for all design tokens |
| `.cursorrules` | Cursor rules file with Quick Reference context |
| `cursor/rules/design-system.mdc` | Cursor v0.43+ MDC rules format |
| `tailwind.config.js` | Tailwind config pre-loaded with the extracted token values |
| `tokens.json` | W3C DTCG-compatible token file for Theo, Style Dictionary, etc. |

The **Quick Reference** inside `layout.md` (Section 0) is designed to be copy-pasted standalone - it fits within tight context budgets and summarises the most critical tokens and rules in 50–75 lines.

---

## Claude Code

Claude Code reads your project's `CLAUDE.md` as persistent context on every prompt. Add the design system there so every component Claude generates is on-brand without you having to paste context manually.

**Step 1:** Open your project's `CLAUDE.md` (or create one in the project root).

**Step 2:** Copy the contents of `CLAUDE.md-section.md` and paste it into a `## Design System` section:

```markdown
## Design System

<!-- Paste CLAUDE.md-section.md contents here -->
```

**Step 3:** For the full layout.md, you can either:
- Add it to the repo and reference it: `See layout.md for full design system`
- Use `claude --context layout.md` to inject it per-session

**Tip:** The Quick Reference (Section 0) is designed for `CLAUDE.md` - it's concise enough to not blow your context budget on every message. Add the full `layout.md` only when you need deep token or component reference.

---

## Cursor

Cursor uses `.cursorrules` or MDC rules files to inject context into every AI prompt in the editor.

### Option A: `.cursorrules` (all Cursor versions)

Copy the `.cursorrules` file to your project root:

```bash
cp path/to/export/.cursorrules .cursorrules
```

Cursor automatically reads this file and injects the context into Composer and Chat.

### Option B: MDC rules (Cursor 0.43+)

Copy the MDC file to your project:

```bash
mkdir -p .cursor/rules
cp path/to/export/cursor/rules/design-system.mdc .cursor/rules/design-system.mdc
```

MDC rules let you set scoping - e.g. apply the design system rules only to `*.tsx` and `*.css` files. Open the file and adjust the `globs` frontmatter field if needed.

### Using in Cursor Composer

With the rules in place, Cursor Composer will automatically follow the design system. You can also reference it explicitly:

```
Build a primary button following our design system
```

---

## GitHub Copilot

Copilot reads `.github/copilot-instructions.md` as persistent project context (requires Copilot Enterprise or GitHub.com integration).

**Step 1:** Create the file:

```bash
mkdir -p .github
```

**Step 2:** Paste the Quick Reference section from `layout.md` into the file:

```markdown
# Copilot Instructions

## Design System
<!-- Paste Section 0 from layout.md here -->
```

For inline completions, Copilot also picks up context from open files - keeping `layout.md` or `tokens.css` open in a tab improves completion quality.

---

## Windsurf

Windsurf reads `.windsurfignore` for file exclusions and supports context injection via its rules system.

**Step 1:** Add a `windsurf.rules` or `.windsurfrules` file to your project root with the Quick Reference content.

**Step 2:** Copy `tokens.css` into your project's stylesheet directory and import it in your global CSS:

```css
@import "./tokens.css";
```

This makes all design tokens available as CSS custom properties throughout your project, so Cascade suggestions naturally use the correct values.

---

## OpenAI Codex

Codex reads `AGENTS.md` - an open standard context file supported by Codex, Cursor, Google Jules, Factory, Amp, and other agents that follow the [agents.md](https://agents.md) spec. One file, many agents.

**Step 1:** Copy `AGENTS.md` from the export to your project root:

```bash
cp path/to/export/AGENTS.md AGENTS.md
```

**Step 2:** Commit it to your repo - Codex reads it automatically on every task.

**That's it.** Codex will follow the design system rules in every UI component it generates.

### Advanced: Subdirectory overrides

If you have a monorepo or multiple packages, you can add more specific rules closer to the code:

```
AGENTS.md                     ← global project rules (design system)
packages/
  web/
    AGENTS.override.md        ← web-specific rules (override the root)
  mobile/
    AGENTS.override.md        ← mobile-specific rules
```

`AGENTS.override.md` at any directory level takes precedence over `AGENTS.md` at the same level.

### Global instructions

To apply the design system across all your Codex sessions regardless of project:

```bash
mkdir -p ~/.codex
cp path/to/export/AGENTS.md ~/.codex/AGENTS.md
```

---

## Integrating the Token Files

Regardless of which AI tool you use, adding the token files to your codebase makes completions more accurate:

**`tokens.css`** - Import in your global stylesheet:
```css
/* In globals.css or app.css */
@import "./tokens.css";
```

**`tailwind.config.js`** - Replace or merge with your existing config:
```js
// Already maps all extracted tokens into Tailwind's theme
const config = require("./tailwind.config.js");
```

**`tokens.json`** - Use with Style Dictionary or Theo to generate platform-specific tokens (iOS, Android, SCSS variables, etc.).

---

## Recommended Workflow

1. **Extract** - Paste a Figma URL or website URL into Layout and run extraction
2. **Review** - Check the extracted tokens in the Source panel. Re-extract if something looks off
3. **Generate** - Click "Generate layout.md" to synthesise the context file from extracted data
4. **Test** - Use the Explorer Canvas to generate a few components. Check the health score (aim for 80+)
5. **Iterate** - Edit layout.md in the Studio's editor to fix anything the AI misidentified. Re-test
6. **Export** - Download the ZIP bundle
7. **Import** - Run `npx @layoutdesign/context import ./layout-export.zip` in your project root
8. **Install** - Run `npx @layoutdesign/context install` to auto-configure your AI tool's MCP settings
9. **Build** - Your AI coding tool now has the design system as context on every prompt

### Quick Setup (CLI)

After exporting from the Studio, the fastest path is three commands:

```bash
npx @layoutdesign/context import ./layout-export.zip
npx @layoutdesign/context install
# Done - your AI agent reads the design system automatically
```

To target a specific tool:

```bash
npx @layoutdesign/context install --target claude
npx @layoutdesign/context install --target cursor
npx @layoutdesign/context install --target windsurf
```

### CLI Commands Reference

| Command | Purpose |
|---------|---------|
| `npx @layoutdesign/context init` | Scaffold `.layout/` directory |
| `npx @layoutdesign/context init --kit <name>` | Init with a specific design kit |
| `npx @layoutdesign/context import <zip-path>` | Import a Studio export ZIP |
| `npx @layoutdesign/context serve` | Start MCP server (stdio) |
| `npx @layoutdesign/context install` | Auto-configure Claude Code / Cursor / Windsurf MCP settings |
| `npx @layoutdesign/context install --target claude` | Target a specific tool |
| `npx @layoutdesign/context use <kit-name>` | Switch design kits |
| `npx @layoutdesign/context list` | Show available kits |

### Manual Setup (without CLI)

If you prefer not to use the CLI, you can still drop the exported files into your project manually - see the per-tool sections above.

### Health Score

The health score (0–100) in the Explorer Canvas measures how closely the generated code follows the design system:

- **80–100** - Tokens are being used correctly; ready to export
- **50–79** - Partial adherence; review the Anti-Patterns section in layout.md
- **0–49** - AI is not picking up the design system; check that layout.md has well-formed CSS code blocks

---

## Explorer Canvas

After extracting your design system, use the Explorer Canvas to generate AI-powered component variants:

1. Switch to the Canvas view using the toggle in the top bar
2. Enter a prompt describing what to explore (e.g. "a pricing card with three tiers")
3. Optionally attach a reference image by pasting, dragging, or clicking the image button
4. Set the number of variants (2–6) and press Cmd+Enter
5. Review generated variants in the grid view
6. Select a variant to refine it with follow-up prompts
7. Use "Compare" to see results with vs without design system context
8. Use "Add to Library" to save a variant (browse saved components in the Source Panel's "Saved" tab)

---

## Quality Score

The Quality tab in the Source Panel shows your layout.md completeness score:

- **90–100:** Production-ready - comprehensive coverage across all sections
- **70–89:** Good - covers most areas, minor gaps in documentation
- **40–69:** Needs work - missing key sections or lacking detail
- **0–39:** Incomplete - significant gaps that will affect AI output quality

The score analyses 6 weighted categories: Quick Reference (15%), Colours (20%), Typography (15%), Spacing (10%), Components (25%), Anti-patterns (15%).

---

## Re-extraction and Diffing

When you re-extract a design system (via the re-extract button in the top bar):

1. Layout captures the previous extraction state
2. Runs a fresh extraction from the source
3. Shows a diff modal highlighting all changes (added, removed, modified tokens/components/fonts)
4. Choose "Accept" to keep the new extraction or "Discard" to revert to the previous state

---

## Figma-First Workflow

Layout supports a bidirectional design loop - push generated components to Figma for designer review, then pull feedback back into code.

### Prerequisites

Connect the Figma MCP server (free, OAuth - no API key needed):

```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

### Push from Studio

In the Explorer Canvas, any result with a code block shows a **Push to Figma** button. Click it to copy a structured prompt to your clipboard, then paste it into Claude Code or Cursor. Your AI agent will call the `push_to_figma` MCP tool to send the component to Figma as an editable auto-layout frame.

### Design Before Code

Use the `design-in-figma` MCP tool to design UI directly in Figma using your loaded design system - before writing any code:

```
"Design a settings page with sidebar navigation"
```

The tool extracts your kit's colour palette, typography, spacing tokens, component inventory, and design rules, then returns step-by-step instructions for calling Figma MCP's `generate_figma_design`.

### The Closed Loop

```
Extract design system → Generate layout.md → Test components
    → Push to Figma → Designer reviews → Update layout.md → Repeat
```

No other open-source tool closes this loop.

---

## Webhook Setup

To automatically sync design changes from Figma:

1. Go to Settings > Webhooks in your organisation dashboard
2. Copy the webhook endpoint URL
3. Paste it into Figma > Admin > Webhooks
4. Generate or enter a matching passcode in both Figma and Layout
5. When a designer publishes changes in Figma, Layout re-extracts tokens automatically

---

## Component Library

Save reusable components from the Explorer Canvas:

1. Generate a component variant in the Explorer Canvas
2. Click "Add to Library" on any variant you want to keep
3. Browse saved components in the Source Panel's "Saved" tab

---

## Tips

- **Narrow the Quick Reference** - If you have a large layout.md, the Quick Reference (Section 0) is the most important part. Keep it focused on the 10–15 tokens your AI uses most.
- **Commit layout.md to your repo** - Treat it like any other configuration file. Update it when the design system changes.
- **Use the context toggle** - In the Explorer Canvas, toggle "layout.md context: OFF" to see what the AI generates without your design system. The gap shows you exactly what value the context file is providing.
- **Re-extract periodically** - Design systems evolve. Re-run extraction after major design updates to keep the context file current.

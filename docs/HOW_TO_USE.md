# How to Use SuperDuper AI Studio

SuperDuper AI Studio extracts design systems from Figma files or live websites and compiles them into an LLM-optimised context bundle. This guide explains how to take that output and use it in your AI coding workflow.

---

## What You Get

When you click **Export** in the Studio, you download a ZIP containing:

| File | Purpose |
|------|---------|
| `DESIGN.md` | Full design system reference (tokens, components, anti-patterns) |
| `CLAUDE.md-section.md` | Drop-in section for your project's `CLAUDE.md` |
| `AGENTS.md` | Context for OpenAI Codex, Jules, Factory, Amp (agents.md standard) |
| `tokens.css` | CSS custom properties for all design tokens |
| `.cursorrules` | Cursor rules file with Quick Reference context |
| `cursor/rules/design-system.mdc` | Cursor v0.43+ MDC rules format |
| `tailwind.config.js` | Tailwind config pre-loaded with the extracted token values |
| `tokens.json` | W3C DTCG-compatible token file for Theo, Style Dictionary, etc. |

The **Quick Reference** inside `DESIGN.md` (Section 0) is designed to be copy-pasted standalone — it fits within tight context budgets and summarises the most critical tokens and rules in 50–75 lines.

---

## Claude Code

Claude Code reads your project's `CLAUDE.md` as persistent context on every prompt. Add the design system there so every component Claude generates is on-brand without you having to paste context manually.

**Step 1:** Open your project's `CLAUDE.md` (or create one in the project root).

**Step 2:** Copy the contents of `CLAUDE.md-section.md` and paste it into a `## Design System` section:

```markdown
## Design System

<!-- Paste CLAUDE.md-section.md contents here -->
```

**Step 3:** For the full DESIGN.md, you can either:
- Add it to the repo and reference it: `See DESIGN.md for full design system`
- Use `claude --context DESIGN.md` to inject it per-session

**Tip:** The Quick Reference (Section 0) is designed for `CLAUDE.md` — it's concise enough to not blow your context budget on every message. Add the full `DESIGN.md` only when you need deep token or component reference.

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

MDC rules let you set scoping — e.g. apply the design system rules only to `*.tsx` and `*.css` files. Open the file and adjust the `globs` frontmatter field if needed.

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

**Step 2:** Paste the Quick Reference section from `DESIGN.md` into the file:

```markdown
# Copilot Instructions

## Design System
<!-- Paste Section 0 from DESIGN.md here -->
```

For inline completions, Copilot also picks up context from open files — keeping `DESIGN.md` or `tokens.css` open in a tab improves completion quality.

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

Codex reads `AGENTS.md` — an open standard context file supported by Codex, Cursor, Google Jules, Factory, Amp, and other agents that follow the [agents.md](https://agents.md) spec. One file, many agents.

**Step 1:** Copy `AGENTS.md` from the export to your project root:

```bash
cp path/to/export/AGENTS.md AGENTS.md
```

**Step 2:** Commit it to your repo — Codex reads it automatically on every task.

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

**`tokens.css`** — Import in your global stylesheet:
```css
/* In globals.css or app.css */
@import "./tokens.css";
```

**`tailwind.config.js`** — Replace or merge with your existing config:
```js
// Already maps all extracted tokens into Tailwind's theme
const config = require("./tailwind.config.js");
```

**`tokens.json`** — Use with Style Dictionary or Theo to generate platform-specific tokens (iOS, Android, SCSS variables, etc.).

---

## Recommended Workflow

1. **Extract** — Paste a Figma URL or website URL into SuperDuper AI Studio and run extraction
2. **Review** — Check the extracted tokens in the Source panel. Re-extract if something looks off
3. **Generate** — Click "Generate DESIGN.md" to synthesise the context file from extracted data
4. **Test** — Use the Test panel to generate a few components. Check the health score (aim for 80+)
5. **Iterate** — Edit DESIGN.md in the Studio's editor to fix anything the AI misidentified. Re-test
6. **Export** — Download the ZIP bundle
7. **Import** — Run `npx @superduperui/context import ./superduper-export.zip` in your project root
8. **Install** — Run `npx @superduperui/context install` to auto-configure your AI tool's MCP settings
9. **Build** — Your AI coding tool now has the design system as context on every prompt

### Quick Setup (CLI)

After exporting from the Studio, the fastest path is three commands:

```bash
npx @superduperui/context import ./superduper-export.zip
npx @superduperui/context install
# Done — your AI agent reads the design system automatically
```

To target a specific tool:

```bash
npx @superduperui/context install --target claude
npx @superduperui/context install --target cursor
npx @superduperui/context install --target windsurf
```

### CLI Commands Reference

| Command | Purpose |
|---------|---------|
| `npx @superduperui/context init` | Scaffold `.superduper/` directory |
| `npx @superduperui/context init --kit <name>` | Init with a specific design kit |
| `npx @superduperui/context import <zip-path>` | Import a Studio export ZIP |
| `npx @superduperui/context serve` | Start MCP server (stdio) |
| `npx @superduperui/context install` | Auto-configure Claude Code / Cursor / Windsurf MCP settings |
| `npx @superduperui/context install --target claude` | Target a specific tool |
| `npx @superduperui/context use <kit-name>` | Switch design kits |
| `npx @superduperui/context list` | Show available kits |

### Manual Setup (without CLI)

If you prefer not to use the CLI, you can still drop the exported files into your project manually — see the per-tool sections above.

### Health Score

The health score (0–100) in the Test panel measures how closely the generated code follows the design system:

- **80–100** — Tokens are being used correctly; ready to export
- **50–79** — Partial adherence; review the Anti-Patterns section in DESIGN.md
- **0–49** — AI is not picking up the design system; check that DESIGN.md has well-formed CSS code blocks

---

## Tips

- **Narrow the Quick Reference** — If you have a large DESIGN.md, the Quick Reference (Section 0) is the most important part. Keep it focused on the 10–15 tokens your AI uses most.
- **Commit DESIGN.md to your repo** — Treat it like any other configuration file. Update it when the design system changes.
- **Use the context toggle** — In the Test panel, toggle "DESIGN.md context: OFF" to see what the AI generates without your design system. The gap shows you exactly what value the context file is providing.
- **Re-extract periodically** — Design systems evolve. Re-run extraction after major design updates to keep the context file current.

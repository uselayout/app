# SuperDuper AI Studio — Feature Documentation

## Product Overview

SuperDuper AI Studio is a browser-based tool that extracts design systems from Figma files and live websites, then compiles them into structured, LLM-optimised context bundles. The output — a DESIGN.md file and supporting token files — gives AI coding agents (Claude Code, Cursor, GitHub Copilot, Windsurf, OpenAI Codex) the design context they need to generate on-brand UI code consistently.

Think of it as a compiler: design system in, AI-ready context out. No manual token extraction, no copy-pasting hex values, no maintaining separate documentation that drifts from the source.

---

## Core Features

### 1. Figma Extraction

#### What It Does
Connects to the Figma REST API and pulls every colour style, text style, effect style, and component from a Figma file. No Figma plugin needed — just a personal access token and a file URL.

#### How It Works
1. Paste a Figma file URL (e.g. `https://www.figma.com/file/abc123/My-Design-System`)
2. Enter your Figma Personal Access Token (PAT) — generated at figma.com/developers
3. AI Studio calls the Figma API, batching node ID requests in groups of 50
4. Extracted data streams back in real-time with progress updates

#### What Gets Extracted
- Colour styles (name, hex, RGB, opacity)
- Text styles (font family, size, weight, line height, letter spacing)
- Effect styles (shadows, blurs)
- Component inventory (name, description, variant count)
- File metadata (name, last modified, version)

#### Use Cases
- **Design system teams**: Extract your Figma token library and distribute to developers as DESIGN.md
- **Agencies**: Quickly onboard a client's Figma file into your AI workflow
- **Solo developers**: Turn any Figma community file into AI context

---

### 2. Website Extraction

#### What It Does
Uses Playwright to load any public website, then scrapes computed CSS from the live DOM — extracting fonts, colours, spacing, border radii, shadows, and component patterns without needing access to the source code or Figma file.

#### How It Works
1. Paste any website URL (e.g. `https://linear.app`)
2. Playwright launches a headless browser and loads the page
3. `page.evaluate()` runs inside the browser context, calling `getComputedStyle()` on key elements
4. Extracted tokens stream back with progress updates

#### What Gets Extracted
- Typography (font families, sizes, weights, line heights from actual rendered elements)
- Colour palette (background, text, border, accent colours as actually computed)
- Spacing patterns (padding, margin, gap values)
- Border radii and shadow values
- Component patterns (buttons, cards, inputs, navigation)

#### Use Cases
- **Competitor analysis**: Extract Stripe's or Linear's design system for reference
- **Legacy projects**: No Figma file? Extract directly from the live site
- **Redesigns**: Capture the current state before rebuilding

---

### 3. DESIGN.md Synthesis

#### What It Does
Takes raw extraction data and synthesises a structured, LLM-optimised DESIGN.md using Claude. This is the core output — a single markdown file that any AI coding agent can consume.

#### How It Works
1. Extraction data (colours, typography, components) feeds into a Claude prompt
2. Claude generates a structured document with standardised sections
3. Content streams in real-time into the Monaco editor
4. User can edit, refine, and regenerate sections

#### DESIGN.md Structure
- **Section 0: Quick Reference** — 50–75 line summary for pasting into any context window
- **Section 1: Colour System** — All colours with semantic naming, usage guidance
- **Section 2: Typography** — Font stack, scale, line heights, usage
- **Section 3: Spacing & Layout** — Spacing scale, grid system, breakpoints
- **Section 4: Components** — Component inventory with props and usage patterns
- **Section 5: Anti-Patterns** — Common mistakes to avoid

---

### 4. Three-Panel Studio

#### What It Does
A professional editing environment with three resizable panels for working with your extracted design system.

#### Panels
- **Source Panel (left)**: Browse extracted tokens, components, and screenshots. Collapsible sections for colours, typography, spacing, effects.
- **Editor Panel (centre)**: Monaco editor with markdown syntax highlighting, custom dark theme, and section navigation. Full editing of the generated DESIGN.md.
- **Test Panel (right)**: AI chat interface where you can test prompts against your design system. Generates live component previews.

#### Editor Features
- Token autocomplete — type a colour name and see the hex value
- Section navigator — jump to any DESIGN.md section
- Health scoring — visual indicator of design system completeness
- Keyboard shortcuts: Cmd+S save, Cmd+E export, Cmd+T focus test panel

---

### 5. Live Component Preview

#### What It Does
The Test Panel renders AI-generated components live in a sandboxed iframe. Ask Claude to build a component using your design system, and see it rendered immediately.

#### How It Works
1. Type a prompt: "Build me a primary button with hover state using these tokens"
2. Claude generates TSX code using your DESIGN.md as context
3. TSX is transpiled server-side via TypeScript
4. Component renders live in a sandboxed iframe with Tailwind CDN
5. View both the rendered result and the source code

#### Use Cases
- Verify your DESIGN.md produces correct output before exporting
- Iterate on token names and values by testing real components
- Demo the value of structured AI context to stakeholders

---

### 6. Export Bundle

#### What It Does
Downloads a ZIP file containing every format your AI coding tool needs — one export, every tool covered.

#### Export Formats

| File | Purpose | AI Tool |
|---|---|---|
| `DESIGN.md` | Full design system reference | All tools |
| `CLAUDE.md` | Drop-in section for project CLAUDE.md | Claude Code |
| `AGENTS.md` | Context file (agents.md open standard) | OpenAI Codex, Cursor, Jules, Factory, Amp |
| `.cursorrules` | Scoped rules for *.tsx and *.css | Cursor |
| `tokens.css` | CSS custom properties | Any project |
| `tokens.json` | W3C DTCG-compatible token file | Style Dictionary, Theo |
| `tailwind.config.js` | Tailwind theme extension | Tailwind projects |

#### How It Works
1. Click Export in the top bar (or press Cmd+E)
2. Select which formats you want in the bundle
3. Click Download — ZIP is generated and downloaded instantly

---

### 7. Project Persistence

#### What It Does
Projects are saved automatically and accessible from the homepage. Return to any previous extraction at any time.

#### How It Works
- Projects persist in localStorage for instant load (works offline)
- When signed in, projects sync to Supabase (accessible from any device)
- Each project stores: name, source URL, source type, extraction data, DESIGN.md content, health score, timestamps

---

## User Workflows

### Workflow 1: Extract from Figma
**Goal**: Turn a Figma design system file into an AI context bundle

1. Paste Figma file URL on the homepage
2. Enter Figma Personal Access Token when prompted
3. Watch extraction progress (5–15 seconds)
4. Review generated DESIGN.md in the Studio editor
5. Test with a component prompt in the Test Panel
6. Export the bundle as a ZIP
7. Drop files into your project repository

### Workflow 2: Extract from a Website
**Goal**: Capture a live website's design system without Figma access

1. Paste the website URL on the homepage
2. Extraction runs automatically (8–20 seconds)
3. Review and edit the DESIGN.md
4. Export and integrate into your project

### Workflow 3: Test Before Export
**Goal**: Verify the DESIGN.md produces good AI output

1. Open any saved project from the homepage
2. Click the Test button or press Cmd+T
3. Type: "Build me a card component with title, description, and CTA"
4. Review the rendered preview and source code
5. If output quality is poor, edit the DESIGN.md and re-test
6. Export once satisfied

---

## Technical Specifications

### Supported Sources
- **Figma**: Any file accessible via Personal Access Token (all plan tiers)
- **Websites**: Any public URL accessible via headless browser

### Supported AI Tools
- Claude Code (CLAUDE.md)
- Cursor (AGENTS.md or .cursorrules)
- GitHub Copilot (paste DESIGN.md into copilot-instructions.md)
- Windsurf (paste into .windsurfrules)
- OpenAI Codex (AGENTS.md)
- Any tool that accepts markdown context

### Browser Support
- Chrome, Edge, Firefox, Safari (latest versions)
- Monaco editor requires a desktop browser

### Data and Privacy
- Figma tokens are entered per-session, never stored on the server
- Anthropic API keys (BYOK mode) are used for the current session only
- Project data stored in Supabase (self-hosted on Hetzner, EU)
- No extraction data is shared with third parties

---

## FAQ

### Do I need a paid Figma plan?
No. The extraction works with any Figma plan, including the free tier. You just need a Personal Access Token.

### Does it work with private websites?
The website extractor uses a headless browser, so it can only access publicly available URLs. Sites behind authentication are not currently supported.

### Can I edit the DESIGN.md after generation?
Yes. The Studio includes a full Monaco editor. You can edit any section, add custom content, or regenerate specific parts.

### What if I don't use Tailwind?
The DESIGN.md and tokens.css work with any CSS approach. The tailwind.config.js is optional — only include it in your export if you use Tailwind.

### Is there an API?
Not yet. The current version is browser-only. A CLI sync tool (`npx @superduperai/sync`) is planned.

---

## Roadmap

- [ ] CLI sync tool — `npx @superduperai/sync` pulls latest DESIGN.md into your project
- [ ] Drift detection — automated re-extraction with diff alerts when tokens change
- [ ] Design system versioning — compare extractions over time
- [ ] Pre-built AI Kits — ready-made bundles for Linear, Stripe, Vercel, Apple
- [ ] Team features — shared project library, team seats, centralised billing

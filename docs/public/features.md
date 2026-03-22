# Layout — Feature Documentation

## Product Overview

Layout is a browser-based tool that extracts design systems from Figma files and live websites, then compiles them into structured, LLM-optimised context bundles. The output — a layout.md file and supporting token files — gives AI coding agents (Claude Code, Cursor, GitHub Copilot, Windsurf, Google Antigravity, OpenAI Codex) the design context they need to generate on-brand UI code consistently.

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
- **Design system teams**: Extract your Figma token library and distribute to developers as layout.md
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

### 3. layout.md Synthesis

#### What It Does
Takes raw extraction data and synthesises a structured, LLM-optimised layout.md using Claude. This is the core output — a single markdown file that any AI coding agent can consume.

#### How It Works
1. Extraction data (colours, typography, components) feeds into a Claude prompt
2. Claude generates a structured document with standardised sections
3. Content streams in real-time into the Monaco editor
4. User can edit, refine, and regenerate sections

#### layout.md Structure (9 sections + 2 appendices)
- **Section 0: Quick Reference** — 50–75 line summary for pasting into any context window
- **Section 1: Design Direction & Philosophy** — Personality, aesthetic intent, explicit rejections
- **Section 2: Colour System** — Three tiers: primitives, semantic aliases, component tokens
- **Section 3: Typography System** — Composite token groups, font stack with fallbacks, pairing rules
- **Section 4: Spacing & Layout** — Base unit, full scale, grid system, breakpoints, flex vs grid rules
- **Section 5: Component Patterns** — 5–10 components with anatomy, token mappings for ALL states, TSX examples
- **Section 6: Elevation & Depth** — Shadow tokens, border tokens, z-index scale
- **Section 7: Motion** — Timing functions, durations, easing tokens
- **Section 8: Anti-Patterns & Constraints** — Numbered NEVER rules with "why it fails" and "what to do instead"
- **Appendix A:** Complete token reference table
- **Appendix B:** Token source metadata + confidence levels

---

### 4. Three-Panel Studio

#### What It Does
A professional editing environment with three resizable panels for working with your extracted design system.

#### Panels
- **Source Panel (left)**: Browse extracted tokens, components, and screenshots. Collapsible sections for colours, typography, spacing, effects.
- **Editor Panel (centre)**: Monaco editor with markdown syntax highlighting, custom dark theme, and section navigation. Full editing of the generated layout.md.
- **Test Panel (right)**: AI chat interface where you can test prompts against your design system. Generates live component previews.

#### Editor Features
- Token autocomplete — type a colour name and see the hex value
- Section navigator — pill buttons to jump between layout.md sections
- Health scoring — automatic 0–100 score measuring token faithfulness, component accuracy, and anti-pattern violations
- Auto-save — 2-second debounce with save indicator
- Keyboard shortcuts: Cmd+S save, Cmd+E export, Cmd+T focus test panel

---

### 5. Live Component Preview

#### What It Does
The Test Panel renders AI-generated components live in a sandboxed iframe. Ask Claude to build a component using your design system, and see it rendered immediately.

#### How It Works
1. Type a prompt: "Build me a primary button with hover state using these tokens"
2. Claude generates TSX code using your layout.md as context
3. TSX is transpiled server-side via TypeScript
4. Component renders live in a sandboxed iframe with Tailwind CDN
5. View both the rendered result and the source code

#### Use Cases
- Verify your layout.md produces correct output before exporting
- Iterate on token names and values by testing real components
- Demo the value of structured AI context to stakeholders

---

### 6. Export Bundle

#### What It Does
Downloads a ZIP file containing every format your AI coding tool needs — one export, every tool covered.

#### Export Formats

| File | Purpose | AI Tool |
|---|---|---|
| `layout.md` | Full design system reference | All tools |
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
- Each project stores: name, source URL, source type, extraction data, layout.md content, health score, timestamps

---

### 8. Billing & Subscriptions

#### What It Does
Credit-based billing system with Stripe integration. Users on the Pro tier get hosted AI credits; free users bring their own API key (BYOK).

#### How It Works
- Stripe Checkout for subscription sign-up, Customer Portal for management
- Credits deducted per AI operation (layout.md generation, test queries)
- Usage tracking with per-operation cost logging
- Subscription tiers: Free (BYOK), Pro (£29/mo — 50 layout.md + 100 test queries), Team (£29/mo + £15/seat)
- Webhook handler syncs subscription state from Stripe events

#### Billing Modules
- `lib/billing/stripe.ts` — Checkout session + portal integration
- `lib/billing/credits.ts` — Credit balance and deduction
- `lib/billing/subscription.ts` — Tier management
- `lib/billing/usage.ts` — Usage stats and history

---

### 9. Figma Closed Loop

#### What It Does
Bidirectional design workflow — push AI-generated components to Figma for designer review, then pull feedback back into code.

#### How It Works
1. Generate a component in the Test Panel using your layout.md context
2. Click **Push to Figma** on any result with a code block
3. A structured prompt is copied to your clipboard with the component code and design tokens
4. Paste into Claude Code or Cursor — the AI calls Figma MCP's `generate_figma_design` to create an editable auto-layout frame in Figma
5. Designer reviews and tweaks in Figma
6. Developer asks the AI to read Figma changes (via Figma MCP) and update the code

#### Design Before Code
Use the `design-in-figma` MCP tool to design UI directly in Figma from a natural language prompt, using your loaded design system tokens — before writing any code.

#### The Loop
```
Extract design system → Generate layout.md → Test components
    → Push to Figma → Designer reviews → Update code → Repeat
```

No other open-source tool closes this loop.

---

## User Workflows

### Workflow 1: Extract from Figma
**Goal**: Turn a Figma design system file into an AI context bundle

1. Paste Figma file URL on the homepage
2. Enter Figma Personal Access Token when prompted
3. Watch extraction progress (5–15 seconds)
4. Review generated layout.md in the Studio editor
5. Test with a component prompt in the Test Panel
6. Export the bundle as a ZIP
7. Drop files into your project repository

### Workflow 2: Extract from a Website
**Goal**: Capture a live website's design system without Figma access

1. Paste the website URL on the homepage
2. Extraction runs automatically (8–20 seconds)
3. Review and edit the layout.md
4. Export and integrate into your project

### Workflow 3: Test Before Export
**Goal**: Verify the layout.md produces good AI output

1. Open any saved project from the homepage
2. Click the Test button or press Cmd+T
3. Type: "Build me a card component with title, description, and CTA"
4. Review the rendered preview and source code
5. If output quality is poor, edit the layout.md and re-test
6. Export once satisfied

---

## Technical Specifications

### Supported Sources
- **Figma**: Any file accessible via Personal Access Token (all plan tiers)
- **Websites**: Any public URL accessible via headless browser

### Supported AI Tools
- Claude Code (CLAUDE.md)
- Cursor (AGENTS.md or .cursorrules)
- GitHub Copilot (paste layout.md into copilot-instructions.md)
- Windsurf (paste into .windsurfrules)
- Google Antigravity (MCP server via MCP Store or manual config)
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

### Can I edit the layout.md after generation?
Yes. The Studio includes a full Monaco editor. You can edit any section, add custom content, or regenerate specific parts.

### What if I don't use Tailwind?
The layout.md and tokens.css work with any CSS approach. The tailwind.config.js is optional — only include it in your export if you use Tailwind.

### Is there an API or CLI?
Yes. The open-source **@layoutdesign/context** package (MIT licensed) provides both a CLI and an MCP server with 9 tools. Install via `npx @layoutdesign/context install` to auto-configure Claude Code, Cursor, Antigravity, or Windsurf. The MCP server gives AI agents direct access to your design system via tools like `get_design_system`, `get_tokens`, `check_compliance`, `preview`, and `push_to_figma`.

### How does billing work?
Free users bring their own Anthropic API key (BYOK) — unlimited extractions, all export formats. Pro users (£29/mo) get hosted AI credits so no API key management is needed. Credits are deducted per layout.md generation and test query.

---

## Roadmap

- [x] CLI + MCP server — @layoutdesign/context (MIT, 9 tools, 3 free kits)
- [x] Pre-built AI Kits — 3 free starter kits (linear-lite, stripe-lite, notion-lite)
- [x] Billing & subscriptions — Stripe integration, credit-based usage, pricing page
- [x] Figma closed loop — Push to Figma button, design-in-figma MCP tool
- [x] Health scoring — automated 0–100 compliance scoring
- [ ] Drift detection — automated re-extraction with diff alerts when tokens change
- [ ] Design system versioning — compare extractions over time
- [ ] Premium AI Kits — full layout.md bundles for Apple iOS, Revolut, Vercel
- [ ] Team features — shared project library, team seats, centralised billing
- [ ] AI Kit marketplace — community-created kits with commission model

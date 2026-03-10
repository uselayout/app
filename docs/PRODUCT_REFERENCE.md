# SuperDuper AI Studio — Product Reference for Content

Use this document when writing tweets, threads, blog posts, or any marketing content. Everything here is factual and verified against the codebase.

---

## One-Liners

- **Tagline:** The compiler between design systems and AI coding agents.
- **Homepage headline:** Your AI builds on-brand.
- **Homepage sub:** Extract any design system. Generate the context your AI needs to build UI that actually looks right.
- **Footer:** Give your AI perfect taste.
- **MCP server:** Give your AI agent a design system in one command.

---

## What It Is

A browser-based tool that extracts design systems from **Figma files** and **live websites**, then transforms them into structured, LLM-optimised context bundles (DESIGN.md) that enable AI coding agents to produce on-brand UI code consistently.

Two products:

1. **SuperDuper AI Studio** — the web app (extract, synthesise, test, export)
2. **@superduperui/context** — open-source MCP server + CLI (npm package, MIT license)

---

## Who It's For

Developers using AI coding tools to build UI:
- Claude Code
- Cursor
- GitHub Copilot
- Windsurf
- OpenAI Codex

The pain: AI generates generic-looking UI. It doesn't know your design system. You spend more time fixing colours, spacing, and typography than you save.

---

## Core User Journey

### AI Studio (web app)
1. **Paste a URL** — Figma file link or any website URL
2. **Extraction runs** — AI pulls colours, typography, spacing, components, design tokens (under 2 minutes)
3. **DESIGN.md generated** — Claude synthesises a structured context file from the raw extraction data
4. **Edit in Studio** — three-panel editor: source tokens (left), markdown editor (centre), AI test panel (right)
5. **Test with/without context** — toggle DESIGN.md on/off, ask Claude to build components, see the difference side-by-side with live preview
6. **Export bundle** — download a ZIP with CLAUDE.md, AGENTS.md, .cursorrules, tokens.css, tokens.json, tailwind.config.js
7. **Drop into your project** — your AI coding tool now builds on-brand

### @superduperui/context (MCP server)
1. `npx @superduperui/context init --kit linear-lite` — creates `.superduper/` directory with DESIGN.md + tokens
2. Add one JSON block to `.claude/settings.json` or `.cursor/mcp.json`
3. Your AI agent now calls `get_design_system` automatically when building UI
4. Use `preview` to render components locally at localhost:4321
5. Use `push_to_figma` to send generated components to Figma as editable frames

---

## What Gets Extracted

### From Figma
- Colour styles (fill values, not just metadata)
- Typography styles (font family, size, weight, line-height, letter-spacing as composites)
- Effect styles (shadows, blur)
- Component inventory (name, description, variant count, property definitions)
- Variables (Enterprise plans only — gracefully skipped otherwise)

### From Websites
- CSS custom properties (all `--var` declarations)
- Font declarations (@font-face rules + computed fonts)
- Computed styles from DOM elements (colours, typography, spacing, borders, shadows, transitions)
- Animations (@keyframes rules)
- Library detection (Tailwind CSS, Bootstrap, etc.)
- Full-page + viewport screenshots

### Token Types
| Type | Examples |
|---|---|
| **Colour** | `--color-primary: #6366F1`, `--color-bg-surface: #17171C` |
| **Typography** | Composite: font-family + size + weight + line-height + letter-spacing |
| **Spacing** | `--space-4: 16px`, `--space-8: 32px` |
| **Radius** | `--radius-md: 8px`, `--radius-full: 9999px` |
| **Effect** | `--shadow-lg: 0 10px 15px rgba(0,0,0,0.1)` |

---

## DESIGN.md Structure (What Gets Generated)

The AI-synthesised context file follows a strict 9-section + 2-appendix format:

0. **Quick Reference** — 50-75 lines, copy-pasteable into CLAUDE.md or .cursorrules. Core tokens, one real component example, critical NEVER rules.
1. **Design Direction & Philosophy** — personality, aesthetic intent, explicit rejections
2. **Colour System** — three tiers: primitives, semantic aliases, component tokens
3. **Typography System** — composite token groups, font stack with fallbacks, pairing rules
4. **Spacing & Layout** — base unit, full scale, grid system, breakpoints, flex vs grid rules
5. **Component Patterns** — 5-10 components with anatomy, token mappings for ALL states (default, hover, focus, active, disabled, loading, error), one real TSX example each
6. **Elevation & Depth** — shadow tokens, border tokens, z-index scale
7. **Motion** — timing functions, durations, easing tokens
8. **Anti-Patterns & Constraints** — numbered NEVER rules with "why it fails" and "what to do instead"
- **Appendix A:** Complete token reference table
- **Appendix B:** Token source metadata + confidence levels

---

## Export Formats

| Format | Filename | What It's For |
|---|---|---|
| **CLAUDE.md** | CLAUDE.md | Design system context for Claude Code |
| **AGENTS.md** | AGENTS.md | Open standard for all agents (Codex, Jules, Factory, Amp) — [agents.md spec](https://agents.md) |
| **Cursor Rules** | .cursor/rules/design-system.mdc + components.mdc | Auto-applied rules in Cursor |
| **CSS Tokens** | tokens.css | CSS custom properties, import directly |
| **JSON Tokens** | tokens.json | W3C DTCG format for design token exchange |
| **Tailwind Config** | tailwind.config.js | Theme extension with extracted colours, spacing, radii |

DESIGN.md is always included in every export.

---

## MCP Server Tools (7)

| Tool | What It Does |
|---|---|
| `get_design_system` | Returns full or sectioned DESIGN.md |
| `get_tokens` | CSS, JSON, or Tailwind token output by type |
| `get_component` | Component spec + code example by name |
| `list_components` | Inventory of all available components |
| `check_compliance` | Validate a code snippet against design rules |
| `preview` | Render component live in local browser canvas (localhost:4321) |
| `push_to_figma` | Send rendered component to Figma as editable frames (via Figma MCP) |

### The Full Code-to-Design Loop
```
Developer prompts Claude
  -> Claude calls get_design_system for context
  -> Claude generates on-brand TSX
  -> Claude calls preview -> renders at localhost:4321
  -> Developer reviews, requests changes
  -> Claude calls push_to_figma -> editable frame in Figma
  -> Designer tweaks in Figma
  -> Developer asks Claude to read Figma changes (via Figma MCP)
  -> Claude updates the code to match
```

No other open-source tool closes this loop.

---

## Free Starter Kits (3)

Bundled with @superduperui/context, extracted from live websites via Playwright:

| Kit | Aesthetic |
|---|---|
| **linear-lite** | Developer tool, dark-first |
| **stripe-lite** | Clean, trust-focused |
| **notion-lite** | Document-first, typography-heavy |

Each includes: Quick Reference, core tokens, 5 component specs.

---

## Pre-Built AI Kits (Premium)

| Kit | Price | Aesthetic |
|---|---|---|
| Linear | £99 | Developer tool, dark-first |
| Revolut | £99 | Dark fintech, data-rich |
| Stripe | £79 | Clean, trust-focused |
| Notion | £79 | Document-first, flexible |
| Vercel | £79 | Minimal, monochrome |
| Apple iOS | £129 | HIG-compliant, light-first |

Full DESIGN.md, all tokens, all components, tailwind config. Extract once, sell many times.

---

## Key Differentiators

1. **Website extraction** — no competitor does this. Massive unlock for teams without Figma.
2. **AI-native output** — CLAUDE.md, AGENTS.md, .cursorrules are formats competitors don't generate.
3. **Speed** — paste a URL, get a complete AI kit in under 2 minutes.
4. **Works with every AI tool** — not locked to one editor or agent.
5. **Open-source MCP server** — MIT licensed, 60-second install-to-value.
6. **Live preview + Figma bridge** — code-to-design closed loop that no other OSS tool has.

---

## Competitive Landscape

| Competitor | What They Do | Our Edge |
|---|---|---|
| **Figma MCP Server** | Connects Claude directly to Figma | We extract from websites too. Figma MCP gives raw data, not structured tokens. |
| **Anima / Locofy** | Figma-to-code plugins | They generate code. We generate context. Different job. |
| **Style Dictionary** | Token pipeline tool | Manual setup, no extraction. We automate everything. |
| **Zeroheight / Supernova** | Design system documentation | Enterprise, expensive, no AI agent integration. |
| **Paper.design** | AI-native design canvas | Closed source, $20/month. We're open source + free tier. |

---

## Stats & Proof Points

- 500+ design tokens extracted per project
- 10x faster on-brand UI with AI context vs without
- 100% compatible with Claude Code, Cursor, and GitHub Copilot
- Under 2 minutes from URL paste to complete AI kit
- 6 export formats covering every major AI coding tool
- 3 free starter kits bundled with the MCP server
- 7 MCP tools including live preview and Figma bridge

---

## Studio Features (for detailed tweets)

- **Three-panel editor:** source tokens (left), Monaco markdown editor (centre), AI test panel (right)
- **Context toggle:** test AI output with and without DESIGN.md — see the quality difference instantly
- **Live component preview:** TSX transpiled server-side, rendered in sandboxed iframe with React + Tailwind
- **Health scoring:** automatic 0-100 score measuring token faithfulness, component accuracy, anti-pattern violations
- **Quick prompts:** preset component requests + dynamic prompts from extracted Figma components
- **Token autocomplete:** type `--` in the editor, get autocomplete suggestions from extracted tokens
- **Section navigation:** pill buttons to jump between DESIGN.md sections
- **Auto-save:** 2-second debounce, save indicator in editor

---

## Tech Stack (for credibility tweets)

- Next.js 15 (App Router), React 19, TypeScript strict mode
- Claude Sonnet 4.6 for synthesis and testing
- Playwright for website extraction
- Figma REST API with rate limiting and batch node resolution
- Monaco Editor with custom dark theme
- Zustand for state with localStorage persistence
- JSZip for bundle generation
- Zod for all API validation
- MCP server built on @modelcontextprotocol/sdk

---

## Pricing Model

| Tier | Price | What You Get |
|---|---|---|
| **Free (BYOK)** | £0 | Bring your own Anthropic API key. Unlimited extractions. All export formats. |
| **Pro** | £19/month | Hosted Claude. Drift monitoring. Priority queue. |
| **Team** | £49/month | Shared library. Team seats. Centralised billing. |

COGS per extraction: ~£0.10-0.25. At Pro tier, break-even is ~75-190 extractions/month. Most users do 5-20.

---

## Content Angles (Tweet Ideas)

### Problem/Solution
- "Your AI writes code that looks like it was designed by a committee of random Tailwind classes"
- "The gap between 'AI-generated UI' and 'production UI' is your design system"
- "Figma MCP gives your AI raw data. We give it taste."

### Before/After
- Show identical prompt with context OFF vs ON — the visual difference is dramatic
- "Left: Claude without design context. Right: Claude with DESIGN.md. Same prompt."

### Technical Credibility
- "We extract 500+ design tokens from a single URL in under 2 minutes"
- "DESIGN.md isn't a style guide — it's a compiler target. Structured for LLM consumption."
- "7 MCP tools, 3 free kits, MIT licensed. `npx @superduperui/context init` and your AI has taste."

### Use Cases
- "Building a SaaS dashboard? Extract Linear's design system, drop it into Claude Code, ship in a day."
- "No Figma access? Point at any live website. We extract the design system from CSS."
- "Designer hands you a Figma file. 2 minutes later, your AI builds pixel-perfect components."

### Open Source Angle
- "We open-sourced the MCP server because design system context should be a standard, not a product."
- "MIT licensed. 60 seconds from npm install to your AI building on-brand."

### The Loop
- "Code -> Preview -> Figma -> Designer review -> Code. The full loop, in one MCP server."
- "Your AI generates TSX. `preview` renders it locally. `push_to_figma` sends it to your designer. They tweak. You pull changes back. Closed loop."

---

## Hashtags & Mentions

- #AIcoding #DesignSystems #MCP #ClaudeCode #Cursor #OpenSource #WebDev #FigmaAPI #DeveloperTools
- @AnthropicAI @figma @cursor_ai @veraborner (Product Hunt)
- r/ClaudeAI, r/cursor, r/webdev, r/reactjs

---

## Links

- **AI Studio:** studio.superduperui.com (staging)
- **Marketing page:** superduperui.com/ai-studio
- **MCP server:** npm @superduperui/context
- **GitHub:** superduperui/context (MIT)

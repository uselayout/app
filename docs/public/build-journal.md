# Build Journal: Layout

## Overview
- **Product**: Layout
- **Duration**: 5–8 March 2026 (3-day intensive build + 2-day polish)
- **Team**: Matt (product/design) + Claude Code (AI pair programmer)
- **Tech Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS v4, Monaco Editor, Zustand, Anthropic SDK, Playwright, Figma API, Better Auth, Supabase

---

## Day 1: 5 March — Foundation + Backend

### Morning
- **Goal**: Scaffold the entire project and get extraction pipelines working
- **Decisions Made**:
  - Chose Next.js App Router over Pages Router — SSE streaming needs route handlers
  - Used Ralph (autonomous agent loop) to execute 28 user stories from a PRD
  - Tailwind v4 with CSS custom properties for the entire design system — no hardcoded colours anywhere
- **Architecture**: Three-panel Studio layout (Source | Editor | Test) inspired by VS Code

### Afternoon
- **Progress**: Complete backend in a single session
  - Figma extraction via REST API with rate-limited batch calls (50 node IDs per request)
  - Website extraction via Playwright — `page.evaluate()` scrapes computed CSS from the live DOM
  - Claude synthesis endpoint — streams layout.md generation via SSE
  - Export bundle generator — JSZip creates ZIP with CLAUDE.md, .cursorrules, tokens.css, tokens.json, tailwind.config.js
- **Key Learning**: Figma's `/v1/files/{key}/styles` endpoint returns metadata only — you must call `/v1/files/{key}/nodes?ids=` separately to get actual values. This isn't documented well.

### End of Day
- **Completed**: Project scaffold, design tokens, TypeScript types, Zustand stores, all 7 API routes, all extraction/generation logic
- **Commits**: Foundation through backend complete (5 commits)

---

## Day 2: 6 March — Studio UI + Polish

### Morning
- **Goal**: Build the three-panel Studio interface and landing page
- **Progress**:
  - Landing page with URL input, "How it Works" section, AI Kits row
  - Three-panel Studio with resizable panes (StudioLayout.tsx)
  - Monaco editor integration (dynamic import, SSR disabled, custom dark theme)
  - Source panel with extracted tokens, component inventory, screenshots
  - Test panel with AI chat interface

### Afternoon
- **Major Feature**: Live component preview in the Test Panel
  - User asks "Build me a primary button with hover state" → Claude generates TSX → rendered live in an iframe
  - TSX transpiled server-side via TypeScript `transpileModule` (not Babel — Babel fails on many TS patterns)
  - Compiled JS embedded in iframe srcdoc with require/exports/module shims
  - **Critical bug found**: `</script>` inside a JS string literal terminates the HTML script tag. Fixed by escaping `<` and `>` in the JSON.stringify output
- **Export Modal**: Format selection grid — users pick which files they want in their ZIP
- **Keyboard Shortcuts**: Cmd+S save, Cmd+E export, Cmd+T test focus

### End of Day
- **Completed**: Full Studio UI, export modal, keyboard shortcuts, health scoring, token autocomplete, section navigator, error states
- **Ralph**: All 28 user stories passing

---

## Day 3: 7–8 March — Auth, Persistence, and Launch Prep

### Morning (7 March)
- **Goal**: Add user accounts and project persistence
- **Decisions**:
  - Better Auth over Supabase Auth — more control, works with direct PostgreSQL
  - Supabase for project storage (CRUD scoped by user_id)
  - Table prefix `layout_` to share the database with other Layout products
- **Gotcha**: Self-hosted Supabase does NOT use SSL. Spent time debugging connection failures before realising `ssl: false` was needed (or rather, just omitting the ssl option entirely)

### Afternoon (7 March)
- **Progress**:
  - My Projects section on homepage — returning users see their saved extractions
  - Test button in TopBar now focuses the Test Panel textarea (forwardRef + useImperativeHandle)
  - Fixed preview panel "Generating..." message bug

### 8 March
- **Documentation**: Created HOW_TO_USE.md — complete guide for using layout.md with Claude Code, Cursor, GitHub Copilot, Windsurf, and OpenAI Codex
- **AGENTS.md Export**: Added AGENTS.md generator and export format for OpenAI Codex compatibility
- **Marketing Page**: Built `/ai-studio` page on layout.design (staging, not linked in nav yet)
- **Product Strategy**: Documented competitive landscape, pricing model, GTM plan

### End of Day
- **Completed**: Auth, persistence, documentation, AGENTS.md export, marketing page, product strategy

---

## Technical Highlights

### Architecture Decisions

1. **SSE over WebSockets**: Extraction and generation endpoints use `ReadableStream` with `X-Accel-Buffering: no`. Simpler than WebSockets, works behind proxies, no connection state to manage.

2. **Server-side TSX transpilation**: The test panel sends TSX to `POST /api/transpile`, which uses TypeScript's `transpileModule` with CommonJS output. This is more reliable than Babel standalone in the browser and handles all TypeScript syntax.

3. **Zustand + localStorage + Supabase**: Local-first architecture. Projects persist in localStorage for instant load, then sync to Supabase when authenticated. Offline-capable.

4. **Design system as CSS variables**: Every colour, spacing value, and animation timing is a CSS custom property. The Studio's own UI uses the same token system it extracts from other products.

### Interesting Solutions

1. **Figma API batching**: Node IDs batched in groups of 50 to stay within API limits. Rate limiter wraps all Figma fetch calls with exponential backoff.

2. **Website CSS extraction**: Playwright's `page.evaluate()` runs inside the browser context, giving access to `getComputedStyle()` on every element. This captures the *actual* rendered values, not just authored CSS — including inherited styles, CSS variable resolutions, and computed font stacks.

3. **iframe sandboxing for preview**: The test panel renders AI-generated components in a sandboxed iframe with `srcdoc`. Tailwind CDN is loaded inside the iframe, and React/ReactDOM are shimmed via CDN. The component code never touches the host page.

### Performance
- Figma extraction: 5–15 seconds depending on file size
- Website extraction: 8–20 seconds (Playwright cold start + page load + CSS scrape)
- layout.md synthesis: 10–30 seconds (Claude streaming)
- Full pipeline: under 2 minutes from URL paste to downloadable ZIP

---

## Stats (Initial Build)
- **Lines of code**: 6,547 (TypeScript/TSX)
- **Commits**: 22
- **Components built**: 19
- **API endpoints**: 7
- **Export formats**: 7 (layout.md, CLAUDE.md, AGENTS.md, .cursorrules, tokens.css, tokens.json, tailwind.config.js)
- **Build duration**: 3 days (foundation → production-ready)

---

## Post-Launch Development (9–11 March)

After the initial 3-day build, significant features were added over the following week:

### Billing & Subscriptions
- Full Stripe integration: checkout sessions, customer portal, webhook handling
- Credit-based usage tracking — per-operation cost logging for layout.md generation and test queries
- Subscription tiers: Free (BYOK), Pro (£29/mo), Team (£29/mo + £15/seat)
- 5 new billing API endpoints + Stripe webhook handler
- Zustand billing store with subscription, credits, and usage state

### Figma Closed Loop
- "Push to Figma" button in TestPanel — copies structured prompt for Figma MCP's `generate_figma_design`
- `design-in-figma` MCP tool — design UI in Figma from natural language using loaded design tokens
- Full code-to-design-to-code loop: generate → preview → push to Figma → designer reviews → pull back

### Marketing & Pages
- Redesigned marketing homepage with Figma-centred narrative (ContextGap, HowItWorks, FigmaLoop, Comparison, OpenSource, AIKits sections)
- Pricing page with tier comparison and billing CTAs
- Documentation pages with sidebar navigation (getting started, Studio walkthrough, CLI, API reference, integration guides)
- Light-mode login page matching marketing aesthetic

### Infrastructure
- Health scoring module (`lib/health/score.ts`) — 0–100 compliance scoring
- SSRF protection on website extraction (`lib/website/validate-url.ts`)
- Shared clipboard utility with `document.execCommand` fallback for HTTP contexts

### Updated Stats
- **API endpoints**: 12 (extraction, generation, export, transpile, billing, webhooks, auth)
- **Commits**: 30+
- **Components**: 25+ (including marketing sections, billing UI, docs)
- **Zustand stores**: 3 (project, extraction, billing)

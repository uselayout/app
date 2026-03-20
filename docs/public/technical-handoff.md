# Technical Handoff: Layout

## Architecture Overview

```
Browser → Next.js App Router → API Route Handlers → External Services
                                    │
                                    ├── Figma REST API (extraction)
                                    ├── Playwright (website extraction)
                                    ├── Anthropic SDK (Claude synthesis + test)
                                    └── Supabase (project persistence)
```

**Pattern**: Local-first with cloud sync. Zustand stores persist to localStorage for instant load. When authenticated, projects sync to Supabase.

**Streaming**: All long-running operations (extraction, synthesis, test) use SSE via `ReadableStream` with `X-Accel-Buffering: no` header.

---

## Repository Structure

```
app/
  page.tsx                      # Marketing homepage (hero, features, pricing preview)
  layout.tsx                    # Root layout with Geist fonts
  globals.css                   # Design tokens + Tailwind v4 config
  login/page.tsx                # Light-mode login/signup page
  pricing/page.tsx              # Pricing tiers + billing CTAs
  docs/                         # Documentation pages with sidebar navigation
  studio/[id]/page.tsx          # Three-panel Studio
  api/
    extract/figma/route.ts      # Figma API extraction → SSE stream
    extract/website/route.ts    # Playwright extraction → SSE stream
    generate/layout-md/route.ts # Claude layout.md synthesis → stream
    generate/test/route.ts      # Test panel Claude calls → stream
    export/bundle/route.ts      # ZIP bundle generation
    transpile/route.ts          # Server-side TSX→JS transpilation
    billing/
      checkout/route.ts         # Stripe checkout session creation
      portal/route.ts           # Stripe customer portal redirect
      subscription/route.ts     # Subscription info lookup
      credits/route.ts          # Credit balance queries
      usage/route.ts            # Usage stats and history
    webhooks/
      stripe/route.ts           # Stripe webhook handler (subscription sync)
    auth/[...all]/route.ts      # Better Auth catch-all routes

components/
  studio/
    StudioLayout.tsx            # Three-panel resize layout
    SourcePanel.tsx             # Left panel (tokens, components, screenshots)
    EditorPanel.tsx             # Centre panel (Monaco editor)
    TestPanel.tsx               # Right panel (AI test + live preview + Figma push)
    ExtractionProgress.tsx      # Full-screen progress overlay
    ExportModal.tsx             # Export format selection + download
  marketing/                    # Homepage sections (ContextGap, HowItWorks, FigmaLoop, etc.)
  shared/
    TopBar.tsx                  # Studio top bar with actions
    CopyBlock.tsx               # Code snippet with one-click copy
    ApiKeyModal.tsx             # Anthropic API key input/storage

lib/
  figma/
    client.ts                   # Rate-limited Figma API wrapper
    extractor.ts                # Figma extraction orchestrator
    parsers/
      styles.ts                 # Colour, text, effect style parsers
      components.ts             # Component inventory parser
  website/
    extractor.ts                # Playwright extraction orchestrator
    css-extract.ts              # page.evaluate() CSS extraction scripts
    validate-url.ts             # SSRF protection + URL validation
  claude/
    synthesise.ts               # layout.md generation prompt + streaming
    test.ts                     # Test panel prompt handling
  export/
    bundle.ts                   # ZIP bundle orchestrator
    claude-md.ts                # CLAUDE.md section generator
    agents-md.ts                # AGENTS.md generator (Codex/Jules/Factory/Amp)
    cursor-rules.ts             # .cursorrules generator
    tokens-css.ts               # tokens.css generator
    tokens-json.ts              # W3C DTCG tokens.json generator
    tailwind-config.ts          # tailwind.config.js generator
  billing/
    stripe.ts                   # Stripe checkout + portal integration
    credits.ts                  # Credit-based usage tracking
    subscription.ts             # Subscription tier management
    usage.ts                    # API usage logging per operation
  health/
    score.ts                    # Design compliance scoring (0–100)
  store/
    project.ts                  # Zustand: project state + localStorage + Supabase sync
    extraction.ts               # Zustand: extraction progress state
    billing.ts                  # Zustand: subscription, credits, usage data
  hooks/
    use-api-key.ts              # Anthropic key storage/retrieval
    use-extraction.ts           # Extraction state management
    use-billing.ts              # Subscription/credits info
    use-keyboard-shortcuts.ts   # Studio keyboard commands
  auth.ts                       # Better Auth server config
  auth-client.ts                # Better Auth browser client
  supabase/
    db.ts                       # Project CRUD (scoped by user_id)
  util/
    detect-source.ts            # Figma vs website URL detection
    copy-to-clipboard.ts        # Clipboard utility with fallback
    resize-screenshot.ts        # Image optimisation for exports
  types/
    index.ts                    # All shared TypeScript interfaces (50+)
```

---

## Getting Started

```bash
# Clone and install
git clone [repo-url]
cd layout-studio
npm install

# Environment variables
cp .env.example .env.local
# Required:
#   ANTHROPIC_API_KEY=sk-ant-...
# Optional:
#   FIGMA_DEFAULT_TOKEN=figd_...
#   DATABASE_URL=postgresql://...
#   BETTER_AUTH_SECRET=...
#   NEXT_PUBLIC_APP_URL=http://localhost:3000

# Run
npm run dev          # http://localhost:3000
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run lint         # ESLint
```

---

## Key Technical Decisions

### 1. SSE over WebSockets
All streaming endpoints return a `ReadableStream`. Simpler than WebSockets, works behind reverse proxies (Coolify/Nginx), and requires no connection state management. The `X-Accel-Buffering: no` header prevents Nginx from buffering the stream.

### 2. Server-side TSX Transpilation
The test panel's live preview uses `POST /api/transpile` which calls TypeScript's `transpileModule` with CommonJS output. This is more reliable than Babel standalone in the browser. The compiled JS is embedded in an iframe's `srcdoc` with require/exports/module shims.

**Critical**: Never put `</script>` inside an inline `<script>` block — even in a JS string literal it terminates the HTML tag. The transpiled code has `<` and `>` escaped via `JSON.stringify` before embedding.

### 3. Zustand + localStorage + Supabase
Local-first: projects persist in localStorage for instant load and offline capability. When authenticated, the store syncs to Supabase. This avoids loading states on return visits and works without network.

### 4. Figma API Batching
The Figma `/v1/files/{key}/styles` endpoint returns metadata only (no values). Must call `/v1/files/{key}/nodes?ids=` separately. Node IDs are batched in groups of 50 with a rate limiter wrapping all fetch calls.

### 5. Better Auth over Supabase Auth
Better Auth gives more control over session handling and works with direct PostgreSQL. Tables use the `layout_` prefix to share the database with other Layout products. Self-hosted Supabase does NOT use SSL — no `ssl` option in the `Pool` config.

### 6. Monaco Editor (dynamic import)
Monaco must be loaded with `dynamic(() => import('@monaco-editor/react'), { ssr: false })`. It's configured with markdown language mode and a custom dark theme matching the Studio design system.

---

## Known Issues / Tech Debt

1. **Playwright on serverless**: Playwright cannot run in Vercel serverless functions. The deployment target is Coolify on Hetzner (116.202.170.188). This is fine for the current setup but limits deployment options.

2. **Figma Variables API**: Returns 403 on non-Enterprise Figma plans. Treated as non-fatal — extraction continues with styles only. Should add a user-facing note about this limitation.

3. **No tests**: The initial build prioritised features over test coverage. Unit tests for parsers and integration tests for API routes should be added before significant refactoring.

4. **TypeScript `transpileModule` in dev only**: The `typescript` package is a devDependency. It's importable in API routes during `npm run dev` but the production build bundles it. This works but is not ideal — consider extracting to a separate service or using esbuild.

5. **No rate limiting**: API routes have no rate limiting beyond credit-based billing quotas. For public deployment, add rate limiting on extraction and generation endpoints.

---

## Deployment

### Current Setup
- **Host**: Hetzner VPS (116.202.170.188)
- **Orchestrator**: Coolify
- **Database**: Self-hosted Supabase on same server (port 5432 for direct PostgreSQL, port 8000 for Supabase API)
- **Domain**: Planned as `layout.design`

### Environment Variables (Production)
```bash
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://postgres:[password]@116.202.170.188:5432/postgres
BETTER_AUTH_SECRET=[random-string]
BETTER_AUTH_URL=https://layout.design
NEXT_PUBLIC_APP_URL=https://layout.design
SUPABASE_URL=http://116.202.170.188:8000
SUPABASE_ANON_KEY=[anon-key]
```

### Subdomain Setup (Pending)
1. Add DNS A record: `layout.design` → `116.202.170.188`
2. Add domain in Coolify for the AI Studio container
3. Coolify auto-provisions SSL via Let's Encrypt

---

## Future Considerations

### For Scaling
- **Playwright workers**: Website extraction is CPU-intensive. At scale, extract to a separate worker service (or use Browserless.io).
- **Queue system**: Long extractions should be queued (BullMQ + Redis) rather than running synchronously in route handlers.
- **CDN for exports**: ZIP bundles could be cached and served from a CDN rather than generated on every download.

### For Features
- **Drift detection**: Cron job re-extracts weekly, diffs against previous version, sends alerts.
- **Versioning**: Store every extraction as a version in Supabase. UI for version comparison.
- **Team features**: Multi-tenancy (org_id), invite flow, shared project library, centralised API key management.

---

## Recent Additions (Post-Launch)

The following were added after the initial 3-day build:

- **Billing system**: Full Stripe integration with credit-based usage tracking, subscription management, checkout/portal flows, and webhook handling (`lib/billing/`, `app/api/billing/`, `app/api/webhooks/stripe/`)
- **Pricing page**: Tier comparison with billing CTAs (`app/pricing/page.tsx`)
- **Health scoring**: Automated 0–100 design compliance scoring — checks hardcoded colours, font usage, anti-pattern violations (`lib/health/score.ts`)
- **Figma closed loop**: "Push to Figma" button in TestPanel copies a structured prompt for the Figma MCP `generate_figma_design` tool
- **Marketing page redesign**: Figma-centred narrative with sections for Context Gap, How It Works, Products, Figma Loop, Comparison, Open Source, AI Kits
- **Documentation pages**: Built-in docs with sidebar navigation (`app/docs/`) covering getting started, Studio walkthrough, CLI, API reference, and integration guides
- **Login page**: Light-mode auth page matching marketing aesthetic
- **SSRF protection**: URL validation on website extraction to prevent server-side request forgery (`lib/website/validate-url.ts`)
- **Billing store**: Zustand store for subscription, credits, and usage data (`lib/store/billing.ts`)

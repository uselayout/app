# Technical Handoff: SuperDuper AI Studio

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
  page.tsx                      # Landing page (URL input, My Projects, AI Kit row)
  layout.tsx                    # Root layout with Geist fonts
  globals.css                   # Design tokens + Tailwind v4 config
  studio/[id]/page.tsx          # Three-panel Studio
  api/
    extract/figma/route.ts      # Figma API extraction → SSE stream
    extract/website/route.ts    # Playwright extraction → SSE stream
    generate/design-md/route.ts # Claude DESIGN.md synthesis → stream
    generate/test/route.ts      # Test panel Claude calls → stream
    export/bundle/route.ts      # ZIP bundle generation
    transpile/route.ts          # Server-side TSX→JS transpilation

components/
  studio/
    StudioLayout.tsx            # Three-panel resize layout
    SourcePanel.tsx             # Left panel (tokens, components)
    EditorPanel.tsx             # Centre panel (Monaco editor)
    TestPanel.tsx               # Right panel (AI test + live preview)
    ExtractionProgress.tsx      # Full-screen progress overlay
    ExportModal.tsx             # Export format selection + download
  shared/
    TopBar.tsx                  # Studio top bar with actions

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
  claude/
    synthesise.ts               # DESIGN.md generation prompt + streaming
    test.ts                     # Test panel prompt handling
  export/
    bundle.ts                   # ZIP bundle orchestrator
    claude-md.ts                # CLAUDE.md section generator
    agents-md.ts                # AGENTS.md generator (Codex/Jules/Factory/Amp)
    cursor-rules.ts             # .cursorrules generator
    tokens-css.ts               # tokens.css generator
    tokens-json.ts              # W3C DTCG tokens.json generator
    tailwind-config.ts          # tailwind.config.js generator
  store/
    project.ts                  # Zustand: project state + localStorage + Supabase sync
    extraction.ts               # Zustand: extraction progress state
  auth.ts                       # Better Auth server config
  auth-client.ts                # Better Auth browser client
  supabase/
    db.ts                       # Project CRUD (scoped by user_id)
  types/
    index.ts                    # All shared TypeScript interfaces
```

---

## Getting Started

```bash
# Clone and install
git clone [repo-url]
cd superduper-ai-studio
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
Better Auth gives more control over session handling and works with direct PostgreSQL. Tables use the `sd_aistudio_` prefix to share the database with other SuperDuper products. Self-hosted Supabase does NOT use SSL — no `ssl` option in the `Pool` config.

### 6. Monaco Editor (dynamic import)
Monaco must be loaded with `dynamic(() => import('@monaco-editor/react'), { ssr: false })`. It's configured with markdown language mode and a custom dark theme matching the Studio design system.

---

## Known Issues / Tech Debt

1. **Playwright on serverless**: Playwright cannot run in Vercel serverless functions. The deployment target is Coolify on Hetzner (116.202.170.188). This is fine for the current setup but limits deployment options.

2. **Figma Variables API**: Returns 403 on non-Enterprise Figma plans. Treated as non-fatal — extraction continues with styles only. Should add a user-facing note about this limitation.

3. **No tests**: The 3-day build prioritised features over test coverage. Unit tests for parsers and integration tests for API routes should be added before significant refactoring.

4. **TypeScript `transpileModule` in dev only**: The `typescript` package is a devDependency. It's importable in API routes during `npm run dev` but the production build bundles it. This works but is not ideal — consider extracting to a separate service or using esbuild.

5. **Two `linear.app` projects**: The project list on the homepage shows duplicate entries. This is a data issue from testing, not a code bug — but deduplication logic could prevent it.

6. **No rate limiting**: API routes have no rate limiting. For public deployment, add rate limiting on extraction and generation endpoints.

---

## Deployment

### Current Setup
- **Host**: Hetzner VPS (116.202.170.188)
- **Orchestrator**: Coolify
- **Database**: Self-hosted Supabase on same server (port 5432 for direct PostgreSQL, port 8000 for Supabase API)
- **Domain**: Planned as `studio.superduperui.com`

### Environment Variables (Production)
```bash
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://postgres:[password]@116.202.170.188:5432/postgres
BETTER_AUTH_SECRET=[random-string]
BETTER_AUTH_URL=https://studio.superduperui.com
NEXT_PUBLIC_APP_URL=https://studio.superduperui.com
SUPABASE_URL=http://116.202.170.188:8000
SUPABASE_ANON_KEY=[anon-key]
```

### Subdomain Setup (Pending)
1. Add DNS A record: `studio.superduperui.com` → `116.202.170.188`
2. Add domain in Coolify for the AI Studio container
3. Coolify auto-provisions SSL via Let's Encrypt

---

## Future Considerations

### For Scaling
- **Playwright workers**: Website extraction is CPU-intensive. At scale, extract to a separate worker service (or use Browserless.io).
- **Queue system**: Long extractions should be queued (BullMQ + Redis) rather than running synchronously in route handlers.
- **CDN for exports**: ZIP bundles could be cached and served from a CDN rather than generated on every download.

### For Features
- **CLI sync**: `npx @superduperai/sync` — read `.superduperrc`, fetch DESIGN.md from API, write to local files.
- **Drift detection**: Cron job re-extracts weekly, diffs against previous version, sends alerts.
- **Versioning**: Store every extraction as a version in Supabase. UI for version comparison.
- **Team features**: Multi-tenancy (org_id), invite flow, shared project library, centralised API key management.

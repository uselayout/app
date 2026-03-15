# Layout

## Overview

Browser-based tool that extracts design systems from Figma files and live websites, then transforms them into structured, LLM-optimised context bundles (DESIGN.md) that enable AI coding agents to produce on-brand UI code consistently.

**Tagline:** The compiler between design systems and AI coding agents.

**Phase 1 scope:** Internal tool - no auth, no database, localStorage persistence only.

**Target users:** Developers using Claude Code, Cursor, GitHub Copilot, Windsurf to build UI.

## Related Repos - DO NOT DUPLICATE

- **CLI + MCP server:** `@layoutdesign/context` (npm) - lives in `mattthornhill/superduperui-context`, NOT here.
  - Commands: `init`, `serve`, `install`, `doctor`, `list`, `use`, `import`
  - 11 MCP tools including `get-design-system`, `preview`, `push-to-figma`
  - If the CLI needs new features (e.g. `pull`, `login`), add them in that repo
  - This repo provides the **backend API endpoints** the CLI calls (e.g. `/api/export/pull`)

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript strict mode, Tailwind CSS v4
- **UI:** shadcn/ui components, custom Studio design system
- **State:** Zustand with localStorage persistence
- **Editor:** @monaco-editor/react (markdown mode, custom dark theme)
- **AI:** @anthropic-ai/sdk - Claude Sonnet 4.6 (claude-sonnet-4-6)
- **Extraction:** Playwright (website), Figma REST API (Figma files)
- **Export:** JSZip for bundle generation
- **Validation:** Zod for all API inputs

## Commands

```bash
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build
npm run typecheck    # TypeScript type check (must pass)
npm run lint         # ESLint (must pass)
```

## Ralph

```bash
./scripts/ralph/ralph.sh        # Run autonomous build (42 iterations)
./scripts/ralph/ralph.sh 50     # Custom iteration count
```

Check story status:
```bash
cat scripts/ralph/prd.json | jq '.userStories[] | {id, title, passes}'
cat scripts/ralph/prd.json | jq '[.userStories[] | select(.passes == false)][0]'
```

## Project Structure

```
app/
  page.tsx                      # Landing page (URL input, AI Kit row)
  layout.tsx                    # Root layout with Geist fonts
  globals.css                   # Design tokens + Tailwind config
  studio/
    [id]/
      page.tsx                  # Three-panel Studio
      loading.tsx               # Loading skeleton
  (dashboard)/
    [org]/
      page.tsx                  # Projects list
      library/                  # Component library pages
      candidates/               # Design variant review
      drift/                    # Drift detection
      analytics/                # Usage analytics
      settings/                 # Org settings (API keys, webhooks, audit, templates)
  api/
    extract/figma/route.ts      # Figma extraction → SSE stream
    extract/website/route.ts    # Website extraction → SSE stream
    generate/design-md/route.ts # Claude DESIGN.md synthesis → stream
    generate/test/route.ts      # Test panel Claude calls → stream
    export/bundle/route.ts      # ZIP bundle generation
    webhooks/figma/route.ts     # Figma webhook receiver
    health/completeness/route.ts # DESIGN.md quality analysis
    organizations/[orgId]/      # Org-scoped API routes
    templates/                  # Template CRUD + publishing
    transpile/route.ts          # TSX transpilation for preview

components/
  studio/
    StudioLayout.tsx            # Three-panel resize layout
    SourcePanel.tsx             # Left panel (tokens, components, screenshots)
    EditorPanel.tsx             # Centre panel (Monaco)
    TestPanel.tsx               # Right panel (AI test)
    ExtractionProgress.tsx      # Full-screen progress overlay
    ExportModal.tsx             # Export format selection + download
    ExplorerCanvas.tsx          # AI-powered design exploration canvas
    ExplorerToolbar.tsx         # Explorer toolbar (prompts, image upload)
    ExplorerVariantCard.tsx     # Individual variant display + actions
    CompletenessPanel.tsx       # DESIGN.md quality score + suggestions
    ExtractionDiffModal.tsx     # Token/component diff on re-extraction
  dashboard/
    CreateComponentModal.tsx    # Component editor with AI chat
  shared/
    TopBar.tsx                  # Studio top bar
  ui/
    ConfirmModal.tsx            # Reusable confirm dialog
    # (other shadcn/ui components)

lib/
  figma/
    client.ts                   # Rate-limited Figma API fetch wrapper
    extractor.ts                # Extraction orchestrator
    parsers/
      styles.ts                 # Colour, text, effect styles
      components.ts             # Component inventory
  website/
    extractor.ts                # Playwright orchestrator
    css-extract.ts              # page.evaluate() CSS extraction scripts
  claude/
    synthesise.ts               # DESIGN.md generation from extraction data
    test.ts                     # Test panel prompt handling
  export/
    bundle.ts                   # ZIP bundle orchestrator
    claude-md.ts                # CLAUDE.md section generator
    cursor-rules.ts             # .cursor/rules/*.mdc generator
    tokens-css.ts               # tokens.css generator
    tokens-json.ts              # W3C DTCG tokens.json generator
    tailwind-config.ts          # tailwind.config.js generator
  auth.ts                       # Better Auth server config
  auth-client.ts                # Better Auth client
  health/
    completeness.ts             # DESIGN.md quality scorer
  extraction/
    diff.ts                     # Extraction diff engine
  integrations/
    github.ts                   # GitHub Git Data API (PR creation)
  store/
    project.ts                  # Zustand: project state + localStorage
    extraction.ts               # Zustand: extraction progress state
    organization.ts             # Org state store
  api/
    auth-context.ts             # API route auth guards
  types/
    index.ts                    # All shared TypeScript interfaces
```

### Dashboard & Settings Pages

The app has a full dashboard at `app/(dashboard)/[org]/`:

```
app/(dashboard)/
  [org]/
    page.tsx                    # Projects list with New Project button
    library/
      page.tsx                  # Component library (create, edit, version)
      [slug]/page.tsx           # Component detail + code editor + preview
    candidates/page.tsx         # Review submitted design variants
    drift/page.tsx              # Design drift detection reports
    analytics/page.tsx          # Usage analytics dashboard
    icons/page.tsx              # Icon library management
    typography/page.tsx         # Typography token explorer
    tokens/page.tsx             # Token browser and editor
    settings/
      page.tsx                  # Settings index
      api-keys/page.tsx         # API key management
      audit/page.tsx            # Audit log viewer
      templates/page.tsx        # Template publishing dashboard
      webhooks/page.tsx         # Figma webhook + GitHub auto-PR config
```

### Explorer Canvas

The Explorer Canvas (`components/studio/ExplorerCanvas.tsx`) enables AI-powered design exploration:

- **Multi-variant generation:** Prompt AI to generate 2-6 component variants simultaneously
- **Image upload:** Attach reference images (paste, drag-drop, or file picker) for AI to interpret
- **Refinement:** Select a variant and refine with follow-up prompts (amber-highlighted input)
- **Comparison view:** A/B compare results with vs without design system context
- **Promote to library:** Save any variant as a component in the org's component library
- **Submit candidate:** Submit variants for team review (appears in candidates dashboard)
- **Push to Figma:** Export selected variant to Figma via push modal
- **Responsive preview:** Preview variants at different viewport sizes

Key files: `ExplorerCanvas.tsx`, `ExplorerToolbar.tsx`, `ExplorerVariantCard.tsx`

### Quality & Health

- **Completeness Panel** (`components/studio/CompletenessPanel.tsx`): Analyses DESIGN.md quality across 6 weighted sections (Quick Reference, Colours, Typography, Spacing, Components, Anti-patterns). Shows score 0-100 with suggestions. Accessed via "Quality" tab in SourcePanel.
- **Extraction Diff** (`components/studio/ExtractionDiffModal.tsx`): On re-extraction, shows token/component/font changes (added, removed, modified) with accept/discard options. Reverts both extraction data and DESIGN.md on discard.
- **Health Score** stored per project, visible in project cards.

### Authentication & Organisation Model

- **Auth:** Better Auth (`lib/auth.ts`, `lib/auth-client.ts`) with email/password + OAuth
- **Organisations:** Multi-user teams with roles (owner, admin, member)
- **Stores:** `lib/store/organization.ts` - current org state, `useOrgStore`
- **Auth guard:** `lib/api/auth-context.ts` - `requireOrgAuth(orgId, permission)` for API routes

### Webhook System

- **Figma webhook receiver** (`app/api/webhooks/figma/route.ts`): Handles FILE_UPDATE events, verifies passcode (per-org Supabase config or env var fallback), looks up project by file key
- **GitHub auto-PR** (`lib/integrations/github.ts`): Creates PRs via Git Data API (blobs → tree → commit → ref → PR) without local clone
- **Webhook config API** (`app/api/organizations/[orgId]/webhook-config/route.ts`): CRUD for per-org webhook settings
- **Settings UI** (`app/(dashboard)/[org]/settings/webhooks/page.tsx`): Configure endpoint URL, passcode, GitHub repo details

### MCP Server (7 Tools)

The MCP endpoint at `app/api/mcp/route.ts` exposes 7 tools for AI coding agents:

| Tool | Purpose |
|------|---------|
| `get_design_system` | Full DESIGN.md content |
| `get_design_section` | Single section (colours, typography, spacing, etc.) |
| `get_tokens` | CSS tokens by category |
| `get_component` | Component code by name |
| `get_component_with_context` | Component + resolved token values + guidelines |
| `list_components` | All components with metadata, tags, token usage |
| `check_compliance` | Validate code against design system rules |

### Template System

- **Publishing:** Org admins can publish their design system as a reusable template
- **Browse:** Public template gallery at `/templates` with search/filter
- **Install:** One-click install of templates into new projects
- **API:** `app/api/templates/` routes for CRUD + publishing

### Component Library

- **Per-org component library** with categories, tags, and versioning
- **Create components** via code editor with live preview and AI chat assistance
- **API:** `app/api/organizations/[orgId]/components/` routes
- **Store:** Components fetched per-org, displayed in dashboard library page

### Planned Features

- **Figma Plugin:** Native Figma plugin for one-click AI Kit export, live token inspector, component sync, push-to-canvas for AI variant generation, webhook management
- **AI Image Generation:** Gemini 3.1 Flash Image Preview integration for generating contextual images in full-page designs

## Studio Design System

The app uses its own dark-first design system. Always use CSS variables, never hardcode colours.

### Key Tokens (use in Tailwind as `bg-[var(--bg-app)]` or `bg-[--bg-app]`)

```css
/* Backgrounds */
--bg-app: #0C0C0E          /* Root background */
--bg-panel: #141418        /* Sidebar, panels */
--bg-surface: #1A1A20      /* Cards, rows */
--bg-elevated: #222228     /* Dropdowns, tooltips */
--bg-hover: #2A2A32        /* Hover states */

/* Borders */
--studio-border: rgba(255,255,255,0.12)
--studio-border-strong: rgba(255,255,255,0.22)
--studio-border-focus: rgba(228,242,34,0.6)

/* Accent - yellow, used sparingly */
--studio-accent: #e4f222
--studio-accent-hover: #eaf655
--studio-accent-subtle: rgba(228,242,34,0.10)

/* Text */
--text-primary: #EDEDF4
--text-secondary: rgba(237,237,244,0.7)
--text-muted: rgba(237,237,244,0.5)

/* Motion */
--duration-base: 150ms
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1)
```

### Design Rules

1. **All backgrounds** use elevation tokens - never arbitrary dark colours
2. **All borders** use `--studio-border` or `--studio-border-strong`
3. **All text** uses `--text-primary`, `--text-secondary`, or `--text-muted`
4. **Interactive states** have transition `all var(--duration-base) var(--ease-out)`
5. **Accent colour** is `--studio-accent` (#e4f222 yellow) - used sparingly for primary CTAs and active states only. Text on accent uses `--text-on-accent` (#08090a dark). No indigo/purple anywhere.
6. **Font:** Geist for UI, Geist Mono for code/editor/monospace content
7. **No box-shadow** - elevation = background colour difference + border

## Conventions

- **TypeScript:** Strict mode, no `any` types
- **Components:** Named exports, "use client" only when needed
- **Commits:** Conventional commits (`feat:`, `fix:`, `chore:`)
- **API routes:** App Router route handlers, Zod validation on all inputs
- **Streaming:** `ReadableStream` with `X-Accel-Buffering: no` header for all streamed responses
- **State:** Zustand stores in `lib/store/`, always with localStorage persist middleware
- **Imports:** Use `@/` alias throughout

## Critical Figma API Note

The `/v1/files/{key}/styles` endpoint returns metadata only (no values).
Must call `/v1/files/{key}/nodes?ids={nodeId}` separately to resolve actual values.
Batch node IDs in groups of max 50.

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...          # Required for Claude synthesis and testing
FIGMA_DEFAULT_TOKEN=figd_...          # Optional: for testing against own Figma files
FIGMA_WEBHOOK_PASSCODE=...            # Optional: global fallback for Figma webhook verification
GOOGLE_AI_API_KEY=...                 # Optional: for AI image generation (planned)
```

## Gotchas

- Monaco editor MUST use `dynamic(() => import('@monaco-editor/react'), { ssr: false })`
- Playwright cannot run in Vercel serverless - fine for Coolify/Hetzner deployment
- Figma Variables API returns 403 on non-Enterprise plans - treat as non-fatal, continue with styles
- Zustand persist with complex types: store only serialisable data (no functions, no Blobs)
- Next.js 15 + Tailwind v4: use `@import "tailwindcss"` not `@tailwind base/components/utilities`

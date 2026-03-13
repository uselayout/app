# Layout

## Overview

Browser-based tool that extracts design systems from Figma files and live websites, then transforms them into structured, LLM-optimised context bundles (DESIGN.md) that enable AI coding agents to produce on-brand UI code consistently.

**Tagline:** The compiler between design systems and AI coding agents.

**Phase 1 scope:** Internal tool — no auth, no database, localStorage persistence only.

**Target users:** Developers using Claude Code, Cursor, GitHub Copilot, Windsurf to build UI.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript strict mode, Tailwind CSS v4
- **UI:** shadcn/ui components, custom Studio design system
- **State:** Zustand with localStorage persistence
- **Editor:** @monaco-editor/react (markdown mode, custom dark theme)
- **AI:** @anthropic-ai/sdk — Claude Sonnet 4.6 (claude-sonnet-4-6)
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
  api/
    extract/figma/route.ts      # Figma extraction → SSE stream
    extract/website/route.ts    # Website extraction → SSE stream
    generate/design-md/route.ts # Claude DESIGN.md synthesis → stream
    generate/test/route.ts      # Test panel Claude calls → stream
    export/bundle/route.ts      # ZIP bundle generation

components/
  studio/
    StudioLayout.tsx            # Three-panel resize layout
    SourcePanel.tsx             # Left panel (tokens, components, screenshots)
    EditorPanel.tsx             # Centre panel (Monaco)
    TestPanel.tsx               # Right panel (AI test)
    ExtractionProgress.tsx      # Full-screen progress overlay
    ExportModal.tsx             # Export format selection + download
  shared/
    TopBar.tsx                  # Studio top bar
  ui/                           # shadcn/ui components

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
  store/
    project.ts                  # Zustand: project state + localStorage
    extraction.ts               # Zustand: extraction progress state
  types/
    index.ts                    # All shared TypeScript interfaces
```

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
--studio-border-focus: rgba(99,102,241,0.7)

/* Accent */
--studio-accent: #818CF8
--studio-accent-hover: #939DF9
--studio-accent-subtle: rgba(129,140,248,0.15)

/* Text */
--text-primary: #EDEDF4
--text-secondary: rgba(237,237,244,0.7)
--text-muted: rgba(237,237,244,0.5)

/* Motion */
--duration-base: 150ms
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1)
```

### Design Rules

1. **All backgrounds** use elevation tokens — never arbitrary dark colours
2. **All borders** use `--studio-border` or `--studio-border-strong`
3. **All text** uses `--text-primary`, `--text-secondary`, or `--text-muted`
4. **Interactive states** have transition `all var(--duration-base) var(--ease-out)`
5. **Accent colour** is `--studio-accent` (#6366F1 indigo) — used for CTAs and active states
6. **Font:** Geist for UI, Geist Mono for code/editor/monospace content
7. **No box-shadow** — elevation = background colour difference + border

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
```

## Gotchas

- Monaco editor MUST use `dynamic(() => import('@monaco-editor/react'), { ssr: false })`
- Playwright cannot run in Vercel serverless — fine for Coolify/Hetzner deployment
- Figma Variables API returns 403 on non-Enterprise plans — treat as non-fatal, continue with styles
- Zustand persist with complex types: store only serialisable data (no functions, no Blobs)
- Next.js 16 + Tailwind v4: use `@import "tailwindcss"` not `@tailwind base/components/utilities`

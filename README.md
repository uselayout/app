# SuperDuper AI Studio

**The compiler between design systems and AI coding agents.**

Extract design systems from Figma files and live websites, then transform them into structured, LLM-optimised context bundles (DESIGN.md) that enable AI coding agents to produce on-brand UI code consistently.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](tsconfig.json)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)

## Why?

AI coding agents (Claude Code, Cursor, Windsurf, GitHub Copilot) generate beautiful UI — but it never matches your brand. They default to Inter, rounded corners, and generic blue buttons.

SuperDuper AI Studio solves this by giving agents the design context they need:

1. **Extract** your design system from a Figma file or live website
2. **Synthesise** it into a structured DESIGN.md using Claude
3. **Export** bundles ready for CLAUDE.md, .cursorrules, tokens.css, tokens.json, and tailwind.config.js

Your AI agents now generate code that matches your actual design system.

## Features

- **Website extraction** — Playwright scrapes CSS variables, computed styles, fonts, and full-page screenshots
- **Figma extraction** — REST API pulls styles, components, variables, and metadata
- **DESIGN.md synthesis** — Claude analyses extracted data and generates a comprehensive, structured design system document
- **Test panel** — Ask Claude to build components using your design system and preview them live in-browser
- **Push to Figma** — Send generated components to Figma as editable frames with auto-layout via the [Figma MCP server](https://www.figma.com/developers/mcp)
- **Export bundles** — One-click ZIP with DESIGN.md, CLAUDE.md section, .cursorrules, tokens.css, W3C DTCG tokens.json, and tailwind.config.js
- **MCP server** — [`@superduperui/context`](https://www.npmjs.com/package/@superduperui/context) gives AI agents direct access to your design system via 10 MCP tools
- **BYOK** — Bring Your Own Key for Anthropic API. Free tier costs nothing.
- **Project management** — Save, switch between, and manage multiple design system projects

## Quick Start

### Prerequisites

- Node.js 20+
- An Anthropic API key ([get one here](https://console.anthropic.com/))
- PostgreSQL database (for auth — [Supabase](https://supabase.com/) works well)

### Setup

```bash
# Clone the repo
git clone https://github.com/mattthornhill/superduperaistudio.git
cd ai-studio

# Install dependencies
npm install

# Install Playwright browsers (for website extraction)
npx playwright install chromium

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and paste a website URL or Figma file link to get started.

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Figma File or   │────▶│  Extract tokens,  │────▶│  Claude synthe-  │
│  Live Website    │     │  styles, comps    │     │  sises DESIGN.md │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                    ┌─────────────────────────────────────┘
                    ▼
        ┌───────────────────────┐
        │  Export bundle:       │
        │  • DESIGN.md          │
        │  • CLAUDE.md section  │
        │  • .cursorrules       │
        │  • tokens.css         │
        │  • tokens.json (W3C)  │
        │  • tailwind.config.js │
        └───────────────────────┘
```

## Using Exported Bundles

After exporting a bundle from the Studio, use the open-source CLI to connect it to your AI agent:

```bash
# Import the bundle into your project
npx @superduperui/context import ~/Downloads/my-design-system.zip

# Auto-configure Claude Code, Cursor, or Windsurf
npx @superduperui/context install
```

The import command:
1. Extracts the bundle into `.superduper/` in your project
2. Merges design system rules into your root `CLAUDE.md` automatically
3. Tells you to run `install` to connect the MCP server

Once connected, your AI agent has access to 10 MCP tools including `get_design_system`, `get_tokens`, `check_compliance`, `push_to_figma`, `design_in_figma`, and `update_tokens`.

See [`@superduperui/context`](https://github.com/mattthornhill/superduperui-context) for the full CLI and MCP server documentation.

## Figma Integration

The Studio works bidirectionally with Figma:

- **Extract from Figma** — Paste a Figma file URL to pull styles, components, and variables
- **Push to Figma** — Test panel's "Send to Figma" button pushes generated components as editable Figma frames
- **Design in Figma** — MCP tool lets AI agents create Figma mockups using your design system before writing code
- **Update tokens** — Change colours or spacing and push updates back across all design system files

Requires the [Figma MCP server](https://www.figma.com/developers/mcp) (OAuth, no API key needed):

```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

## Studio Layout

The Studio is a three-panel workspace:

- **Left — Source Panel**: View extracted tokens, components, and screenshots
- **Centre — Editor**: Monaco editor with your DESIGN.md (edit freely)
- **Right — Test Panel**: Ask Claude to build components using your design system and preview them live

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS v4
- **UI**: shadcn/ui + custom dark design system
- **State**: Zustand with localStorage persistence
- **Editor**: Monaco Editor (markdown mode)
- **AI**: Anthropic SDK — Claude Sonnet 4.6
- **Extraction**: Playwright (websites), Figma REST API
- **Export**: JSZip for bundle generation
- **Auth**: Better Auth with PostgreSQL
- **Database**: Supabase (project storage)
- **Validation**: Zod for all API inputs

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint (strict, zero warnings)
npm run typecheck    # TypeScript type checking
```

## Project Structure

```
app/
  page.tsx                      # Landing page
  studio/[id]/page.tsx          # Three-panel Studio
  api/
    extract/figma/route.ts      # Figma extraction (SSE stream)
    extract/website/route.ts    # Website extraction (SSE stream)
    generate/design-md/route.ts # DESIGN.md synthesis (stream)
    generate/test/route.ts      # Test panel (stream)
    export/bundle/route.ts      # ZIP bundle generation

components/
  studio/                       # Studio panels and overlays
  shared/                       # Shared components
  ui/                           # shadcn/ui primitives

lib/
  figma/                        # Figma API client and parsers
  website/                      # Playwright extraction
  claude/                       # AI synthesis and test prompts
  export/                       # Bundle generators
  store/                        # Zustand stores
  types/                        # TypeScript interfaces
```

## Self-Hosting

SuperDuper AI Studio runs on any platform that supports Node.js and Playwright:

- **Coolify** / **Dokku** — Use the included Dockerfile
- **Railway** / **Render** — Deploy from Git
- **VPS** — Docker or bare Node.js

> **Note**: Playwright cannot run in Vercel serverless. Use a container-based platform for website extraction.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, coding standards, and PR guidelines.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## License

[MIT](LICENSE) — SuperDuper UI Ltd

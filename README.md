# Layout

**The compiler between design systems and AI coding agents.**

Extract design systems from Figma files and live websites, then transform them into structured, LLM-optimised context bundles (DESIGN.md) that enable AI coding agents to produce on-brand UI code consistently.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](tsconfig.json)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)

## Why?

AI coding agents (Claude Code, Cursor, Windsurf, GitHub Copilot) generate beautiful UI - but it never matches your brand. They default to Inter, rounded corners, and generic blue buttons.

Layout solves this by giving agents the design context they need:

1. **Extract** your design system from a Figma file or live website
2. **Synthesise** it into a structured DESIGN.md using Claude
3. **Export** bundles ready for CLAUDE.md, .cursorrules, tokens.css, tokens.json, and tailwind.config.js

Your AI agents now generate code that matches your actual design system.

## Features

- **Website extraction** - Playwright scrapes CSS variables, computed styles, fonts, and full-page screenshots
- **Figma extraction** - REST API pulls styles, components, variables, and metadata
- **DESIGN.md synthesis** - Claude analyses extracted data and generates a comprehensive, structured design system document
- **Explorer Canvas** - AI-powered design exploration with multi-variant generation, image upload, comparison view, health scoring, and iterative refinement
- **Push to Figma** - Send generated components to Figma as editable frames with auto-layout via the [Figma MCP server](https://www.figma.com/developers/mcp)
- **Export bundles** - One-click ZIP with DESIGN.md, CLAUDE.md section, .cursorrules, tokens.css, W3C DTCG tokens.json, and tailwind.config.js
- **MCP server** - [`@layoutdesign/context`](https://www.npmjs.com/package/@layoutdesign/context) gives AI agents direct access to your design system via 7 MCP tools
- **BYOK** - Bring Your Own Key for Anthropic API. Free tier costs nothing.
- **Project management** - Save, switch between, and manage multiple design system projects
- **Saved components** - Save variants as components or full-page designs with categories and tags
- **Quality scoring** - Automated DESIGN.md completeness analysis across 6 weighted categories
- **Extraction diffing** - Visual diff when re-extracting an existing project, with accept/discard workflow per change
- **Webhook sync** - Figma webhook receiver detects design changes for re-extraction
- **Organisation model** - Multi-user teams with role-based access (owner, admin, member)

## Quick Start

### Prerequisites

- Node.js 20+
- An Anthropic API key ([get one here](https://console.anthropic.com/))
- PostgreSQL database (for auth - [Supabase](https://supabase.com/) works well)

### Setup

```bash
# Clone the repo
git clone https://github.com/uselayout/app.git
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
npx @layoutdesign/context import ~/Downloads/my-design-system.zip

# Auto-configure Claude Code, Cursor, or Windsurf
npx @layoutdesign/context install
```

The import command:
1. Extracts the bundle into `.layout/` in your project
2. Merges design system rules into your root `CLAUDE.md` automatically
3. Tells you to run `install` to connect the MCP server

Once connected, your AI agent has access to 7 MCP tools:

| Tool | Description |
|------|-------------|
| `get_design_system` | Full DESIGN.md content for the active project |
| `get_design_section` | A specific section of the design system |
| `get_tokens` | Design tokens as structured JSON |
| `get_component` | Component definition and usage guidance |
| `get_component_with_context` | Component with surrounding design context |
| `list_components` | All components in the active project |
| `check_compliance` | Validate a code snippet against the design system |

See [`@layoutdesign/context`](https://github.com/uselayout/cli) for the full CLI and MCP server documentation.

## Figma Plugin (Coming Soon)

A native Figma plugin is in development that will expose Layout features directly inside Figma:

- One-click token extraction without leaving Figma
- Live token inspector for selected elements
- Push selected frames to Layout Explorer Canvas for AI variant generation
- Export bundles directly from the plugin

## AI Image Generation (Coming Soon)

Contextual image generation powered by Gemini 3.1 Flash Image Preview will allow full-page designs to include on-brand placeholder imagery, hero images, and component previews generated directly within the Studio - no external tools required.

## Figma Integration

The Studio works bidirectionally with Figma:

- **Extract from Figma** - Paste a Figma file URL to pull styles, components, and variables
- **Push to Figma** - Explorer Canvas "Push to Figma" button sends generated components as editable Figma frames
- **Design in Figma** - MCP tool lets AI agents create Figma mockups using your design system before writing code

Requires the [Figma MCP server](https://www.figma.com/developers/mcp) (OAuth, no API key needed):

```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

## Studio Layout

The Studio is a two-panel workspace with an Editor/Canvas toggle:

- **Left - Source Panel**: View extracted tokens, components, screenshots, quality scores, and saved components
- **Centre - Editor / Explorer Canvas**: Toggle between the Monaco DESIGN.md editor and the AI-powered Explorer Canvas for generating and refining component variants

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS v4
- **UI**: shadcn/ui + custom dark design system
- **State**: Zustand with localStorage persistence
- **Editor**: Monaco Editor (markdown mode)
- **AI**: Anthropic SDK - Claude Sonnet 4.6
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
  page.tsx                          # Landing page
  studio/[id]/page.tsx              # Two-panel Studio
  (dashboard)/
    [org]/
      page.tsx                      # Projects list
      settings/                     # Org settings (API keys, billing, members, webhooks)
  api/
    extract/figma/route.ts          # Figma extraction (SSE stream)
    extract/website/route.ts        # Website extraction (SSE stream)
    generate/design-md/route.ts     # DESIGN.md synthesis (stream)
    generate/explore/route.ts       # Explorer Canvas AI generation (stream)
    export/bundle/route.ts          # ZIP bundle generation
    export/pull/route.ts            # CLI pull endpoint
    webhooks/figma/route.ts         # Figma webhook receiver
    health/completeness/route.ts    # DESIGN.md quality analysis
    organizations/[orgId]/          # Org-scoped API (components, members, etc.)
    transpile/route.ts              # TSX transpilation for preview

components/
  studio/                           # Studio panels, Explorer Canvas, variant cards
  shared/                           # Shared components (TopBar)
  ui/                               # shadcn/ui primitives
  marketing/                        # Landing page sections

lib/
  figma/                            # Figma API client and parsers
  website/                          # Playwright extraction
  claude/                           # AI synthesis prompts
  export/                           # Bundle generators
  health/                           # Quality and health scoring
  store/                            # Zustand stores
  supabase/                         # Database helpers
  types/                            # TypeScript interfaces
```

## Self-Hosting

Layout runs on any platform that supports Node.js and Playwright:

- **Coolify** / **Dokku** - Use the included Dockerfile
- **Railway** / **Render** - Deploy from Git
- **VPS** - Docker or bare Node.js

> **Note**: Playwright cannot run in Vercel serverless. Use a container-based platform for website extraction.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, coding standards, and PR guidelines.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## License

[MIT](LICENSE) - Layout UI Ltd

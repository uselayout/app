# Contributing to SuperDuper AI Studio

Thanks for your interest in contributing! This guide will help you get set up and understand our conventions.

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or [Supabase](https://supabase.com/) free tier)
- Anthropic API key for AI features
- Figma personal access token (optional, for Figma extraction testing)

### Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/ai-studio.git
cd ai-studio

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Set up environment
cp .env.example .env.local
# Fill in your values in .env.local

# Run dev server
npm run dev
```

### Verify Your Setup

```bash
npm run typecheck    # Should pass with zero errors
npm run lint         # Should pass with zero warnings
npm run build        # Should complete successfully
```

## Development Workflow

1. Create a branch from `main`: `git checkout -b feat/your-feature`
2. Make your changes
3. Run checks: `npm run typecheck && npm run lint`
4. Commit using [conventional commits](#commit-conventions)
5. Open a pull request against `main`

## Coding Standards

### TypeScript

- **Strict mode** — no `any` types
- All API inputs validated with Zod
- Named exports for components, default exports for pages

### Components

- Functional components with hooks only
- `"use client"` directive only when needed (event handlers, hooks, browser APIs)
- Use `@/` import alias throughout

### Styling

- Tailwind CSS v4 with CSS custom properties
- Always use design tokens (`var(--bg-app)`, `var(--text-primary)`, etc.) — never hardcode colours
- See `app/globals.css` for the full token reference

### API Routes

- App Router route handlers (`route.ts`)
- Zod validation on all inputs
- Streaming responses use `ReadableStream` with `X-Accel-Buffering: no` header

### State Management

- Zustand stores in `lib/store/`
- Always use localStorage persist middleware
- Store only serialisable data (no functions, no Blobs)

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Figma variable extraction
fix: handle rate limit on style endpoint
chore: update Playwright to 1.58
docs: add self-hosting guide
refactor: extract token parser into separate module
```

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a clear description of what changed and why
- Ensure `npm run typecheck` and `npm run lint` pass
- Add/update tests if applicable
- Screenshots for UI changes

## Architecture Notes

### Extraction Pipeline

1. User submits a URL (website) or Figma file key
2. Server streams extraction progress via SSE
3. Extracted data stored in Zustand (client-side)
4. User triggers DESIGN.md generation → Claude synthesises from extracted data
5. User exports a ZIP bundle with multiple format outputs

### Key Patterns

- **Streaming**: All AI endpoints return `ReadableStream` responses
- **BYOK**: Users can provide their own Anthropic API key via `X-Api-Key` header
- **Rate limiting**: Figma API calls are batched (max 50 node IDs per request)

## Getting Help

- Open a [GitHub Discussion](https://github.com/mattthornhill/superduperaistudio/discussions) for questions
- File a [bug report](https://github.com/mattthornhill/superduperaistudio/issues/new?template=bug_report.yml) for issues
- Check existing issues before opening a new one

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Please read it before participating.

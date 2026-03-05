# Ralph Iteration

You are in a Ralph autonomous loop for **SuperDuper AI Studio**.

## Your Job (ONE story only)

1. Read `scripts/ralph/prd.json`
2. Find the **highest priority** story where `passes: false`
3. Check `scripts/ralph/build-log.json` for this story's attempt count
4. Implement **ONLY** that one story
5. Run checks:
   ```bash
   npm run typecheck
   npm run lint
   ```
6. Verify in browser using dev-browser skill for frontend stories
7. If ALL checks pass:
   ```bash
   git add .
   git commit -m "feat([scope]): [what you did]"
   ```
   Then:
   - Update `scripts/ralph/prd.json`: set that story's `passes: true`
   - Update `scripts/ralph/build-log.json`: add story entry with attempts and status
8. If checks FAIL:
   - Update `scripts/ralph/build-log.json`: increment attempts for this story
   - Fix the issues and retry
9. Add learnings to `scripts/ralph/progress.txt`

## Build Log Updates

When completing a story, add/update in build-log.json stories array:
```json
{
  "id": "story-id",
  "title": "Story title",
  "attempts": 1,
  "status": "completed",
  "completedAt": "ISO timestamp"
}
```

## Rules
- **ONE** story per iteration
- Commit after completing each story
- Track attempts in build-log.json
- If stuck >5 min, add notes to story's `notes` field and move on
- Never modify stories that already have `passes: true`
- Read CLAUDE.md for project conventions before starting

## Quick Reference
```bash
# Check status
cat scripts/ralph/prd.json | jq '.userStories[] | {id, title, passes}'

# See what's next
cat scripts/ralph/prd.json | jq '[.userStories[] | select(.passes == false)][0]'

# Check progress
cat scripts/ralph/progress.txt

# Check build stats
cat scripts/ralph/build-log.json | jq '{iterations, stories: [.stories[] | {title, attempts, status}]}'
```

## Critical Technical Notes

### Figma API — Style Value Resolution
The /v1/files/{key}/styles endpoint returns metadata only (name, type, nodeId).
You MUST make a SEPARATE request to get actual values:
```typescript
const nodeIds = styles.map(s => s.node_id).join(',');
const response = await figmaFetch(`/files/${key}/nodes?ids=${nodeIds}`);
// Then read response.nodes[nodeId].document.fills[0] for colours
// Or response.nodes[nodeId].document.style for text styles
```

### Monaco in Next.js App Router
MUST use dynamic import with ssr: false:
```typescript
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false, loading: () => <div className="editor-skeleton" /> }
);
// The component file must have "use client" at the top.
```

### Playwright in API Routes
```typescript
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
// extraction...
await browser.close(); // always in finally block
```

### Claude Streaming from API Routes
```typescript
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const stream = anthropic.messages.stream({
  model: 'claude-sonnet-4-6',
  max_tokens: 8192,
  system: systemPrompt,
  messages: [{ role: 'user', content: userPrompt }],
});

return new Response(
  new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const event of stream) {
        if (event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    }
  }),
  {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Accel-Buffering': 'no',
    }
  }
);
```

### Zustand with localStorage
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useProjectStore = create(
  persist(
    (set, get) => ({
      // state and actions
    }),
    { name: 'superduper-projects' }
  )
);
```

### Tailwind CSS v4 with CSS Variables
Use arbitrary values to reference Studio design tokens:
```tsx
// Correct
<div className="bg-[var(--bg-panel)] border border-[var(--studio-border)]">

// Or use the exposed Tailwind tokens:
<div className="bg-[--bg-panel] text-[--text-primary]">
```

### Next.js Route Handlers (App Router)
```typescript
// app/api/example/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  // ...
}
```

## Project Context
Read `CLAUDE.md` for full project conventions and architecture.

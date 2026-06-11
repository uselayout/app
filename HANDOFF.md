# Gallery Bespoke Stability — Session Handoff

> Drop a fresh Claude Code session into the worktree at
> `.claude/worktrees/staging-batch-gallery-import` and point it at this file.

## TL;DR

The Kit Gallery's bespoke generation pipeline went unstable today. Symptoms: "no available server" 503s during regen, kits showing "Script error" in the iframe, hung regens, blank gallery. Spent most of the session chasing the wrong root cause (sync TypeScript transpile blocking the event loop) and broke things further with an esbuild migration. Reverted the transpile to TypeScript, then ran agents that found the **actual** root causes:

1. **Playwright leaked Chromium zombies** because `context` and `page` were never closed on error.
2. **Four heavy jobs ran in parallel per publish** with no coordination.
3. **Hero generation had no concurrency limit**.

All three are fixed in commit `b270419` (merged to staging at `47dba71`). User just needs to **restart the staging container in Coolify** to clear the zombies that accumulated *before* the fix landed.

## Original goal (still in progress)

Populate `staging.layout.design/gallery` with ~56 brand-faithful kits (Apple, Stripe, Linear, Notion, Figma, Airtable, Headspace, Ramp, etc.). User publishes one kit at a time through Studio. Each publish auto-generates:
- **Style profile** (cheap Claude JSON, ~5s, drives uniform template per-kit)
- **Bespoke showcase** (Claude TSX, ~60s, brand-faithful Live Preview)
- **Playwright snapshot** (PNG of the iframe for the gallery card)
- **Hero image** (GPT Image 2 brand cover)

`scripts/regen-bespoke.ts` is the local CLI fallback for when server-side regen fails.

Already published & generally OK: Linear, Apple, Asana, Stripe, Figma, Headspace, Ramp, Airtable. ~50 still to publish.

## What happened today (in order)

1. Renamed kits in admin (Ramp from "ramp.com — opus4.7" → "Ramp"). Auto-regen fired on every rename — wasteful for a copy-only change.
2. User reported "no available server" 503s during bespoke regen.
3. Diagnosed (incorrectly) as the TypeScript compiler blocking the Node event loop during transpile.
4. Migrated `lib/transpile.ts` to esbuild (commits `5a14698`, `89ae259`, `c0047c0`).
5. Build broke (Turbopack tried to bundle esbuild's native binary). Fixed with `serverExternalPackages: ["esbuild"]`.
6. Build deployed → **every bespoke kit started showing "Script error"**. esbuild's CJS output envelope is incompatible with the iframe runtime shim.
7. Reverted `lib/transpile.ts` to TypeScript compiler (commit `8bdc2f0`, merged at `32580c7`). Kits work again.
8. User questioned whether we'd been chasing symptoms. Spawned 3 Explore agents. They found the **real** root causes (below).
9. Shipped the real fixes (commit `b270419`, merged at `47dba71`). User still needs to restart the container to clear zombies.

## Real root causes (agent findings, ranked)

### 1. Playwright `context` + `page` never closed on error
**File**: `lib/gallery/snapshot.ts`

```ts
// BEFORE: only browser closed
} finally {
  await browser.close().catch(() => {});
}
```

If `goto()` or `screenshot()` threw or timed out, the BrowserContext + Page kept their WebSocket and IPC channels open. Each failed snapshot leaked a zombie Chromium subprocess. Over time the staging container ran out of file descriptors → "no available server" on every request, even ones unrelated to snapshots.

**FIXED in `b270419`**: track `context` and `page` in vars, close them in `finally` no matter what threw.

### 2. Four heavy jobs raced on the Node thread per publish
**File**: `lib/gallery/run-generation-jobs.ts`

Every publish fired in parallel:
- Style profile (Claude JSON)
- Bespoke (Claude TSX + transpile)
- Playwright snapshot (Chromium 150-300MB RAM)
- Hero (GPT Image 2 + 2-4MB base64 buffer)

No coordination. Healthcheck timed out under combined load.

**FIXED in `b270419`**: bespoke + snapshot now run sequentially in a single chain (snapshot needs the bespoke TSX to capture the right content anyway). Hero stays parallel but bounded. Style profile stays parallel and cheap.

### 3. Hero generation had no concurrency cap
**File**: `lib/gallery/hero.ts`, `lib/concurrency.ts`

Multiple parallel publishes each decoded a 2K base64 PNG into a heap Buffer. Cheap per call, fatal in parallel.

**FIXED in `b270419`**: `heroGenerationLimit = createLimiter(1, 120_000)` and `kitSnapshotLimit = createLimiter(1, 120_000)`. Both wrap their respective entry points.

## What was broken (and is now reverted/fixed)

- ❌ esbuild transpile migration → reverted in `8bdc2f0`. **Don't try this again** without first matching esbuild's CJS output to the iframe runtime shim. The shim is wherever the gallery page builds the iframe srcdoc — search for `script.textContent` and `module.exports`.
- ✅ Auto-regen on kit rename → replaced with cheap string-replace in cached TSX (commit `84d91ca`). PATCH endpoint detects name/description change, splits-and-joins on the cached `showcase_custom_tsx`, re-transpiles, persists in one round trip.
- ✅ Rename "ramp.com — opus4.7" → "Ramp" no longer requires a Claude regen.

## Code state

**Latest staging commit**: `47dba71` (merge of `b270419`).

**Worktree branch**: `staging-batch-gallery-import` at `b270419`.

**Key files in their current good state**:

| File | Status |
|---|---|
| [lib/transpile.ts](lib/transpile.ts) | TypeScript compiler (sync internals, async signature) |
| [lib/gallery/snapshot.ts](lib/gallery/snapshot.ts) | Closes context + page in finally; wrapped in `kitSnapshotLimit` |
| [lib/gallery/hero.ts](lib/gallery/hero.ts) | Wrapped in `heroGenerationLimit` |
| [lib/gallery/run-generation-jobs.ts](lib/gallery/run-generation-jobs.ts) | Bespoke + snapshot serial; hero parallel; style profile parallel |
| [lib/concurrency.ts](lib/concurrency.ts) | `bespokeShowcaseLimit(2)`, `styleProfileLimit(3)`, `heroGenerationLimit(1)`, `kitSnapshotLimit(1)` |
| [lib/claude/generate-kit-showcase.ts](lib/claude/generate-kit-showcase.ts) | Strict prompt: no fake logos, no emojis, no nav scroll, hover required, read kit name from `window.__KIT__` |
| [components/admin/KitsTab.tsx](components/admin/KitsTab.tsx) | Inline-editable name + description, portal'd dropdowns, blue progress text |
| [app/api/admin/kits/[id]/route.ts](app/api/admin/kits/[id]/route.ts) | PATCH detects rename → string-replaces cached TSX → re-transpiles |

## What the user must do RIGHT NOW

1. **Restart the staging container in Coolify** — http://94.130.130.22:8000/ → staging app → Restart. Kills any zombie Chromium processes from before the fix landed. ~30s.

2. Verify health:
   ```sh
   curl -s -o /dev/null -w "%{http_code}\n" https://staging.layout.design/api/health/ready
   ```
   Should return `200`.

3. Visit the admin Kits tab. The hung "Generating… 6m+" status on Linear is a stale client-side timer. Refresh clears it.

4. Regen any kit showing "Script error" in the gallery (any kit that was regenerated during the esbuild window today has bad cached JS). Either:
   - Admin Kits tab → row → Generate ▾ → Regen bespoke (Claude)
   - Or local CLI: `npx tsx scripts/regen-bespoke.ts --env staging --slug <slug>`

## What still needs verification

- After container restart + a fresh bespoke regen, watch the healthcheck stay `200` throughout. If it flips to `503` even briefly, there's another blocker we haven't found.
- Try two near-simultaneous regens on different kits. With `bespokeShowcaseLimit(2)` they should both succeed; a third would queue.
- Check Coolify metrics: container CPU should peak ~30-40% during a single regen, not 100%.

## Open follow-ups (not urgent)

- **Stream listener cleanup** ([lib/claude/generate-kit-showcase.ts:316](lib/claude/generate-kit-showcase.ts)) — agent #3 flagged that the `stream.on("text", ...)` listener isn't removed. Low-impact memory leak; would only matter under sustained load.
- **Per-job timeouts** in `runKitGenerationJobs` — if a Claude or Playwright call hangs forever, the semaphore slot is never freed. The 120-180s limiter timeouts are a partial mitigation.
- **`fetchKitById` over-fetches** — pulls full `rich_bundle` (100-300KB JSONB) on every PATCH. Could be slimmed to only the columns needed.
- **Bulk regen UI** — manual one-at-a-time Generate ▾ clicks for 50+ kits is tedious. The local CLI script is the better path: `npx tsx scripts/regen-bespoke.ts --env staging --all --concurrency 2`.

## Reference: prior plans + memory

- **Plan file** (full history of decisions): `/Users/matt/.claude/plans/we-have-buiult-out-fancy-gizmo.md`
- **Project memory**: `/Users/matt/.claude/projects/-Users-matt-Cursor-Projects-Layout-layout-studio/memory/MEMORY.md`
- **Two scripts** (don't confuse them):
  - `scripts/import-gallery-batch.ts` — extract URL → create Studio Project → publish Kit. The 56 Studio Projects in the user's account came from this.
  - `scripts/regen-bespoke.ts` — local Claude + transpile, POSTs result to `/api/admin/kits/[id]/showcase`. Doesn't touch Studio Projects.

## How a fresh session should start

1. `cd "/Users/matt/Cursor Projects/Layout/layout-studio/.claude/worktrees/staging-batch-gallery-import"`
2. `git pull` to make sure you're on `b270419` or later.
3. Read this file end-to-end before touching anything.
4. The user is mid-cleanup. Don't ship new changes until they confirm the current state is stable.
5. Resume from "What the user must do RIGHT NOW" above.

## Tone for the next session

User has spent a long day on this and is frustrated. Lead with what's verified, not what might be true. Don't propose architectural rewrites unless they explicitly ask. Do verify-then-fix, not fix-then-verify.

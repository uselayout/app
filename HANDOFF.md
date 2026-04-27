# Gallery Batch Import — Session Handoff

> Use this in a fresh Claude Code session. Picks up the launch-Gallery-with-56-kits work where context ran out.

## Where we are

You're filling `staging.layout.design/gallery` with ~56 design kits derived from real brand websites (Apple, Stripe, Linear, Notion, Figma, Asana, Headspace, etc.). Pipeline shipped, server stability fixed. **Most of your 56 Studio Projects are empty shells from a failed parallel run** — the script crashed staging mid-batch, leaving Projects without extractions.

## The two scripts (don't confuse them)

| Script | Purpose | Touches Studio Projects? | Touches Gallery Kits? |
|---|---|---|---|
| `scripts/import-gallery-batch.ts` | End-to-end: extract URL → create Project → publish Kit | **Yes** (creates one per URL) | **Yes** (publishes after) |
| `scripts/regen-bespoke.ts` | Local Claude + transpile → POST bespoke TSX/JS to existing kit | No | Updates existing kit row only |

Both run **locally** on your Mac (Anthropic + Playwright + TypeScript transpile happen on your CPU, not the server).

## Why the empty Projects exist

Earlier `import-gallery-batch.ts` runs fired multiple kits in parallel against staging. Combined with server-side bespoke generation (now removed), this pegged Coolify's Node container at 100% CPU, healthcheck timed out, Traefik dropped the backend. Some kits made it to "Project created" but the extract / synthesise / publish steps failed before completing. Those orphan Projects are what you see under [Personal](app/(dashboard)/[org]/page.tsx) in your dashboard.

## Server-stability fix already shipped

Commit `b3c402d` moved **all** bespoke Claude work off the server. It now lives in `scripts/regen-bespoke.ts` (runs locally, POSTs result back). Two new admin endpoints back this:

- `GET  /api/admin/kits/[id]/source` — read kit data ([app/api/admin/kits/[id]/source/route.ts](app/api/admin/kits/[id]/source/route.ts))
- `POST /api/admin/kits/[id]/showcase` — accept pre-generated TSX/JS ([app/api/admin/kits/[id]/showcase/route.ts](app/api/admin/kits/[id]/showcase/route.ts))

Concurrency limiters in [lib/concurrency.ts](lib/concurrency.ts) cap any leftover server-side generation (style profile only).

## What to do next

### Step 1 — clean up empty Projects (manual, optional)

Open [https://staging.layout.design](https://staging.layout.design), Personal org → Projects. Delete any without extractions. Or leave them; they don't affect the Gallery.

### Step 2 — re-run the batch script with low concurrency

The script currently runs serially per-kit (no `--concurrency` flag), but the **pipeline still includes a server-side publish**. Don't fire many at once.

```sh
cd "/Users/matt/Cursor Projects/Layout/layout-studio"
git checkout staging && git pull
export ADMIN_API_KEY=6cb70c63ece317b9d1cccc430fb524fbea9324eb80f9d182e5617a676849d8f1
export ANTHROPIC_API_KEY=sk-ant-...    # your key
export LAYOUT_BATCH_ORG=personal-0pFM0JL1-mnivnsxd

# Smoke test first
npx tsx scripts/import-gallery-batch.ts --env staging --limit 1

# Then resume the rest (skips already-published)
npx tsx scripts/import-gallery-batch.ts --env staging --resume
```

State is in `scripts/data/gallery-batch.state.json` — `--resume` skips entries already marked complete.

### Step 3 — regen bespoke for kits already in the Gallery

Once a kit publishes, it ships with the **uniform template** + style profile (cheap, fast, no Claude transpile). To upgrade a kit to brand-faithful **bespoke** TSX:

```sh
export ADMIN_API_KEY=6cb70c63ece317b9d1cccc430fb524fbea9324eb80f9d182e5617a676849d8f1
export ANTHROPIC_API_KEY=sk-ant-...

# One kit
npx tsx scripts/regen-bespoke.ts --env staging --slug apple

# Several
npx tsx scripts/regen-bespoke.ts --env staging --slugs apple,asana,stripe,linear,figma

# All published kits, two at a time on your Mac
npx tsx scripts/regen-bespoke.ts --env staging --all --concurrency 2

# Dry run to preview output sizes without posting
npx tsx scripts/regen-bespoke.ts --env staging --slug apple --dry-run
```

Each kit takes ~30-90s. Failures are logged per-kit; the loop continues.

## Key files to know

| File | What |
|---|---|
| [scripts/import-gallery-batch.ts](scripts/import-gallery-batch.ts) | Original batch: extract → Project → publish |
| [scripts/regen-bespoke.ts](scripts/regen-bespoke.ts) | Local bespoke regen, POSTs to admin endpoints |
| [scripts/data/gallery-batch.seed.json](scripts/data/gallery-batch.seed.json) | The 56-kit input (URLs + metadata) |
| [scripts/data/gallery-batch.state.json](scripts/data/gallery-batch.state.json) | Resume state (gitignored) |
| [scripts/data/card-images/](scripts/data/card-images/) | Local card image folder (gitignored) |
| [lib/gallery/run-generation-jobs.ts](lib/gallery/run-generation-jobs.ts) | Server-side post-publish jobs (style profile + preview + hero only — no bespoke) |
| [lib/claude/generate-kit-showcase.ts](lib/claude/generate-kit-showcase.ts) | Claude prompt for bespoke TSX |
| [lib/claude/generate-kit-style-profile.ts](lib/claude/generate-kit-style-profile.ts) | Claude prompt for v2 style profile |
| [lib/types/kit-style-profile.ts](lib/types/kit-style-profile.ts) | v2 schema (16 colour fields + button/input/card/badge/tab) |
| [components/gallery/kit-showcase-source.ts](components/gallery/kit-showcase-source.ts) | Uniform iframe template (fallback when no bespoke) |
| [components/admin/KitsTab.tsx](components/admin/KitsTab.tsx) | Admin row dropdowns: Card / Status / Generate |

## Constraints baked in (don't undo)

- **No server-side bespoke**: bespoke TSX never generates on the staging server. It runs locally via `regen-bespoke.ts` only. This is the fix for the CPU starvation that killed staging.
- **Bearer admin auth**: `ADMIN_API_KEY` env var enables script auth without a session cookie. Wired into `lib/api/admin-context.ts` + `lib/api/admin-bearer.ts`.
- **Bearer-admin exempt from rate limits**: `app/api/extract/website/route.ts` and `app/api/generate/layout-md/route.ts` skip rate-limit checks when `bearerAdmin` is set.
- **Style profile auto-fires on publish**: cheap (~$0.005/kit), produces v2 JSON profile. The uniform template reads it. Kits look brand-coloured immediately, even before bespoke regen.
- **Concurrency limiters**: `bespokeShowcaseLimit = createLimiter(2)` and `styleProfileLimit = createLimiter(3)` in [lib/concurrency.ts](lib/concurrency.ts).

## Recovery hatch

If staging goes down mid-batch again:
1. Coolify dashboard: http://94.130.130.22:8000/
2. Restart the app container, or wait 2-5 min for in-flight Claude calls to drain
3. Re-run with `--resume`

## Open follow-ups

- ~50 empty Projects in your Personal org (cosmetic — Gallery doesn't read these)
- Bespoke regen for the ~5 kits already published (Apple, Asana, Stripe, Linear, Figma)
- Visual QA per brand after bespoke regen — iterate Claude prompt if any kit looks off
- Production rollout when staging is stable: same migration, same env vars on the prod Coolify app

## Most recent user signals

- "this is turning out to take longer than if i had done this manually" (frustration with bespoke quality + server crashes — both addressed)
- Rejected lowering Claude tokens or dropping bespoke entirely: "they look really bad! They will give an unfair view of how good Layout's variant generation is"
- Chose the off-server move (commit `b3c402d`) as the path forward

Resume confidently. You can run `regen-bespoke.ts` against the published kits any time — the server stays stable now.

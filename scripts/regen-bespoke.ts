#!/usr/bin/env npx tsx
/**
 * Regenerate bespoke showcases for kits. Runs Claude + TypeScript
 * transpile LOCALLY (your Mac's CPU) and POSTs the result back to
 * staging. Keeps the heavy work off the staging server, which got
 * starved when /api/admin/kits/:id/generate-showcase ran inline.
 *
 * Usage:
 *   npx tsx scripts/regen-bespoke.ts --env staging --slug apple
 *   npx tsx scripts/regen-bespoke.ts --env staging --slugs apple,asana,stripe
 *   npx tsx scripts/regen-bespoke.ts --env staging --all
 *   npx tsx scripts/regen-bespoke.ts --env staging --all --concurrency 2
 *
 * Env vars:
 *   ADMIN_API_KEY      bearer token (must match deployed value)
 *   ANTHROPIC_API_KEY  for the Claude call (BYOK; no server credit deducted)
 *
 * Per kit:
 *   1. GET  /api/admin/kits/{id}/source       → fetch kit data
 *   2. generateKitShowcase(...)               → Claude + transpile, locally
 *   3. POST /api/admin/kits/{id}/showcase     → store TSX/JS + flip flag
 *
 * Failures are logged and the next kit continues. State is the DB —
 * re-running just regenerates the kit again.
 */

import { generateKitShowcase, type KitBrandingAsset } from "../lib/claude/generate-kit-showcase";

const HOSTS = {
  staging: "https://staging.layout.design",
  production: "https://layout.design",
} as const;

type Env = keyof typeof HOSTS;

interface CliArgs {
  env: Env;
  slugs: string[] | "all";
  concurrency: number;
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  const envValue = flag("--env");
  if (envValue !== "staging" && envValue !== "production") {
    console.error("Missing --env staging|production");
    process.exit(1);
  }

  const all = argv.includes("--all");
  const single = flag("--slug");
  const multi = flag("--slugs");
  let slugs: string[] | "all";
  if (all) slugs = "all";
  else if (multi) slugs = multi.split(",").map((s) => s.trim()).filter(Boolean);
  else if (single) slugs = [single];
  else {
    console.error("Pass --slug <slug>, --slugs a,b,c, or --all");
    process.exit(1);
  }

  const concRaw = flag("--concurrency");
  const concurrency = concRaw ? Math.max(1, parseInt(concRaw, 10)) : 1;
  const dryRun = argv.includes("--dry-run");

  return { env: envValue, slugs, concurrency, dryRun };
}

interface KitSource {
  id: string;
  slug: string;
  kitName: string;
  kitDescription?: string;
  kitTags: string[];
  layoutMd: string;
  tokensCss: string;
  brandingAssets?: KitBrandingAsset[];
}

interface ApiCtx {
  host: string;
  apiKey: string;
}

async function fetchKitSourceById(ctx: ApiCtx, id: string): Promise<KitSource> {
  const res = await fetch(`${ctx.host}/api/admin/kits/${id}/source`, {
    headers: { Authorization: `Bearer ${ctx.apiKey}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`source fetch HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as KitSource;
}

async function listAllKitIds(ctx: ApiCtx): Promise<Array<{ id: string; slug: string }>> {
  const res = await fetch(`${ctx.host}/api/admin/kits`, {
    headers: { Authorization: `Bearer ${ctx.apiKey}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`list kits HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const body = (await res.json()) as { kits: Array<{ id: string; slug: string }> };
  return body.kits.map((k) => ({ id: k.id, slug: k.slug }));
}

async function lookupKitIdBySlug(ctx: ApiCtx, slug: string): Promise<string | null> {
  const all = await listAllKitIds(ctx);
  return all.find((k) => k.slug === slug)?.id ?? null;
}

async function postShowcase(
  ctx: ApiCtx,
  kitId: string,
  tsx: string,
  js: string,
): Promise<{ slug: string; tsxLen: number; jsLen: number }> {
  const res = await fetch(`${ctx.host}/api/admin/kits/${kitId}/showcase`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ctx.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tsx, js }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`showcase POST HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as { slug: string; tsxLen: number; jsLen: number };
}

async function regenOne(ctx: ApiCtx, slug: string, dryRun: boolean): Promise<void> {
  const t0 = Date.now();
  console.log(`▸ ${slug}: looking up kit id...`);
  const kitId = await lookupKitIdBySlug(ctx, slug);
  if (!kitId) {
    console.warn(`  skip ${slug} (not found)`);
    return;
  }

  console.log(`  ${slug}: fetching source...`);
  const source = await fetchKitSourceById(ctx, kitId);

  console.log(`  ${slug}: generating bespoke (Claude + transpile)...`);
  let lastReport = 0;
  const result = await generateKitShowcase({
    kitName: source.kitName,
    kitDescription: source.kitDescription,
    kitTags: source.kitTags,
    layoutMd: source.layoutMd,
    tokensCss: source.tokensCss,
    brandingAssets: source.brandingAssets,
    onProgress: (_delta, total) => {
      // Print every 500 chars so the operator sees forward motion without
      // flooding the terminal. ~5-15 updates over a typical generation.
      if (total - lastReport >= 500) {
        process.stdout.write(`\r  ${slug}: streaming... ${total} chars`);
        lastReport = total;
      }
    },
  });
  process.stdout.write(`\r  ${slug}: streamed ${result.tsx.length} chars total       \n`);

  if (dryRun) {
    console.log(
      `  ${slug}: [dry-run] generated ${result.tsx.length} chars TSX → ${result.js.length} chars JS in ${formatElapsed(Date.now() - t0)}`,
    );
    return;
  }

  console.log(`  ${slug}: posting showcase...`);
  const posted = await postShowcase(ctx, kitId, result.tsx, result.js);
  console.log(
    `✔ ${slug}: stored ${posted.tsxLen} chars TSX / ${posted.jsLen} chars JS in ${formatElapsed(Date.now() - t0)}`,
  );
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return ms + "ms";
  const s = Math.round(ms / 1000);
  return s < 60 ? s + "s" : Math.floor(s / 60) + "m " + (s % 60) + "s";
}

async function main(): Promise<void> {
  const args = parseArgs();
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) {
    console.error("Missing ADMIN_API_KEY env var.");
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Missing ANTHROPIC_API_KEY env var (Claude calls run locally).");
    process.exit(1);
  }
  const ctx: ApiCtx = { host: HOSTS[args.env], apiKey };

  let slugs: string[];
  if (args.slugs === "all") {
    const all = await listAllKitIds(ctx);
    slugs = all.map((k) => k.slug);
    console.log(`Resolved --all → ${slugs.length} kits`);
  } else {
    slugs = args.slugs;
  }

  console.log(`Bespoke regen → ${args.env} (${ctx.host})`);
  console.log(`  kits: ${slugs.join(", ")}`);
  console.log(`  concurrency: ${args.concurrency}`);
  if (args.dryRun) console.log("  [DRY-RUN] not posting results");
  console.log("");

  let succeeded = 0;
  let failed = 0;

  // Simple semaphore for local concurrency. Default 1 (serial) so the
  // user's machine isn't pegged either.
  let inFlight = 0;
  const queue: Array<() => void> = [];
  async function runWithLimit(fn: () => Promise<void>): Promise<void> {
    if (inFlight >= args.concurrency) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    inFlight++;
    try {
      await fn();
    } finally {
      inFlight--;
      const next = queue.shift();
      if (next) next();
    }
  }

  await Promise.all(
    slugs.map((slug) =>
      runWithLimit(async () => {
        try {
          await regenOne(ctx, slug, args.dryRun);
          succeeded++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`✘ ${slug}: ${msg}`);
          failed++;
        }
      }),
    ),
  );

  console.log("─────────────────────────────────────");
  console.log(`Done. ${succeeded} succeeded, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

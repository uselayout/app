#!/usr/bin/env npx tsx
/**
 * Batch-import URLs to the public Kit Gallery: extract -> synthesise
 * layout.md -> publish as the official Layout-team author. One JSON config
 * in, fifty approved kits out.
 *
 * Usage:
 *   npx tsx scripts/import-gallery-batch.ts --env staging
 *   npx tsx scripts/import-gallery-batch.ts --env staging --limit 1
 *   npx tsx scripts/import-gallery-batch.ts --env staging --resume
 *   npx tsx scripts/import-gallery-batch.ts --env staging --input scripts/data/gallery-batch.json
 *
 * Required env vars:
 *   ADMIN_API_KEY    bearer token (must match the deployed server's value)
 *   LAYOUT_BATCH_ORG slug or UUID of the org the admin user is a member of
 *                    (can also be passed via --org)
 *
 * The script never touches the credit ledger: the deployed
 * `/api/generate/layout-md` route detects bearer-admin auth and uses the
 * server's ANTHROPIC_API_KEY without quota checks.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

const HOSTS = {
  staging: "https://staging.layout.design",
  production: "https://layout.design",
} as const;

type Env = keyof typeof HOSTS;

interface InputEntry {
  url: string;
  name: string;
  description?: string;
  tags?: string[];
  licence?: "MIT" | "CC-BY-4.0" | "custom";
  licenceCustom?: string;
  tier?: "minimal" | "rich";
  unlisted?: boolean;
  include?: {
    components?: boolean;
    fonts?: boolean;
    branding?: boolean;
    context?: boolean;
  };
}

type Status =
  | "pending"
  | "extracting"
  | "synthesising"
  | "publishing"
  | "published"
  | "failed";

interface StateEntry {
  url: string;
  name: string;
  projectId?: string;
  kitId?: string;
  kitSlug?: string;
  status: Status;
  error?: string;
  attempts: number;
  lastAttempt?: string;
  publishedAt?: string;
}

type StateFile = Record<string, StateEntry>;

interface CliArgs {
  env: Env;
  inputPath: string;
  statePath: string;
  limit: number;
  resume: boolean;
  org: string;
}

function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const idx = argv.indexOf(name);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };

  const envValue = flag("--env");
  if (envValue !== "staging" && envValue !== "production") {
    console.error("Missing or invalid --env staging|production");
    process.exit(1);
  }

  const inputPath = flag("--input") ?? "scripts/data/gallery-batch.json";
  const statePath = flag("--state") ?? "scripts/data/gallery-batch.state.json";
  const limitRaw = flag("--limit");
  const limit = limitRaw ? Math.max(1, parseInt(limitRaw, 10)) : Infinity;
  const resume = argv.includes("--resume");
  const org = flag("--org") ?? process.env.LAYOUT_BATCH_ORG ?? "";
  if (!org) {
    console.error(
      "Missing --org <slug> (or LAYOUT_BATCH_ORG env var). Pick the org slug or UUID the admin user is a member of.",
    );
    process.exit(1);
  }

  return { env: envValue, inputPath, statePath, limit, resume, org };
}

function loadInput(p: string): InputEntry[] {
  if (!existsSync(p)) {
    console.error(`Input file not found: ${p}`);
    process.exit(1);
  }
  const parsed = JSON.parse(readFileSync(p, "utf8"));
  if (!Array.isArray(parsed)) {
    console.error(`Input file must be a JSON array: ${p}`);
    process.exit(1);
  }
  return parsed as InputEntry[];
}

function loadState(p: string): StateFile {
  if (!existsSync(p)) return {};
  return JSON.parse(readFileSync(p, "utf8")) as StateFile;
}

function saveState(p: string, state: StateFile): void {
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(state, null, 2) + "\n", "utf8");
}

interface RequestContext {
  host: string;
  apiKey: string;
  org: string;
}

async function authedFetch(
  ctx: RequestContext,
  pathname: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${ctx.apiKey}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${ctx.host}${pathname}`, { ...init, headers });
}

/**
 * Drain the SSE response from `/api/extract/website`. Resolves to the final
 * extraction payload from the `complete` event. Throws on stream-level
 * errors or a stream that ends without a `complete` event.
 */
async function streamExtract(
  ctx: RequestContext,
  url: string,
  projectId: string,
  onProgress: (msg: string) => void,
): Promise<Record<string, unknown>> {
  const res = await authedFetch(ctx, "/api/extract/website", {
    method: "POST",
    body: JSON.stringify({ url, projectId }),
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`extract HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: Record<string, unknown> | null = null;
  let errorMessage: string | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const ev of events) {
      const dataLine = ev.split("\n").find((l) => l.startsWith("data: "));
      if (!dataLine) continue;
      let parsed: { type: string; [k: string]: unknown };
      try {
        parsed = JSON.parse(dataLine.slice(6));
      } catch {
        continue;
      }
      if (parsed.type === "step") {
        const pct = String((parsed.percent as number) ?? 0).padStart(3, " ");
        const detail = (parsed.detail as string) ?? "";
        onProgress(`${pct}% ${detail}`);
      } else if (parsed.type === "complete") {
        result = parsed.data as Record<string, unknown>;
      } else if (parsed.type === "error") {
        errorMessage = String(parsed.message ?? "unknown extraction error");
      } else if (parsed.type === "chunk-start" || parsed.type === "chunk" || parsed.type === "chunk-end") {
        // Chunked send: server splits oversized payloads into multiple events.
        // The final reassembled object arrives via `complete` after all chunks.
      }
    }
  }
  if (errorMessage) throw new Error(errorMessage);
  if (!result) throw new Error("Extraction stream ended without complete event");
  return result;
}

/**
 * Drain the streaming text response from `/api/generate/layout-md`. Returns
 * the full markdown document. The endpoint streams plain text chunks so a
 * naive concat is sufficient.
 */
async function streamLayoutMd(
  ctx: RequestContext,
  extractionData: Record<string, unknown>,
  projectId: string,
): Promise<string> {
  const res = await authedFetch(ctx, "/api/generate/layout-md", {
    method: "POST",
    body: JSON.stringify({ extractionData, projectId }),
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`layout-md HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let out = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  if (out.trim().length === 0) {
    throw new Error("layout-md stream returned an empty document");
  }
  return out;
}

const nowIso = (): string => new Date().toISOString();

interface ProjectShell {
  id: string;
  name: string;
  sourceType: "website";
  sourceUrl: string;
  layoutMd: string;
  extractionData: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

function buildProjectShell(args: {
  projectId: string;
  name: string;
  url: string;
}): ProjectShell {
  const now = nowIso();
  return {
    id: args.projectId,
    name: args.name,
    sourceType: "website",
    sourceUrl: args.url,
    layoutMd: "",
    extractionData: null,
    createdAt: now,
    updatedAt: now,
  };
}

async function processEntry(
  ctx: RequestContext,
  entry: InputEntry,
  state: StateFile,
  statePath: string,
): Promise<void> {
  const log = (msg: string): void => console.log(`  ${msg}`);
  const url = entry.url;

  const cur: StateEntry = state[url] ?? {
    url,
    name: entry.name,
    status: "pending",
    attempts: 0,
  };
  cur.attempts += 1;
  cur.lastAttempt = nowIso();
  cur.name = entry.name;
  state[url] = cur;
  saveState(statePath, state);

  // Reuse projectId across attempts so partial work survives a crash.
  const projectId = cur.projectId ?? randomUUID();
  cur.projectId = projectId;

  const shell = buildProjectShell({ projectId, name: entry.name, url });

  log("creating project shell...");
  const putShellRes = await authedFetch(
    ctx,
    `/api/organizations/${ctx.org}/projects/${projectId}`,
    { method: "PUT", body: JSON.stringify(shell) },
  );
  if (!putShellRes.ok) {
    const text = await putShellRes.text().catch(() => "");
    throw new Error(`create shell HTTP ${putShellRes.status}: ${text.slice(0, 300)}`);
  }

  cur.status = "extracting";
  saveState(statePath, state);
  log(`extracting ${url}...`);
  const extractionData = await streamExtract(ctx, url, projectId, (msg) => {
    process.stdout.write(`    ${msg}\r`);
  });
  process.stdout.write("\n");

  cur.status = "synthesising";
  saveState(statePath, state);
  log("synthesising layout.md...");
  const layoutMd = await streamLayoutMd(ctx, extractionData, projectId);

  log("persisting project...");
  const fullProject = {
    ...shell,
    extractionData,
    layoutMd,
    updatedAt: nowIso(),
  };
  const putFullRes = await authedFetch(
    ctx,
    `/api/organizations/${ctx.org}/projects/${projectId}`,
    { method: "PUT", body: JSON.stringify(fullProject) },
  );
  if (!putFullRes.ok) {
    const text = await putFullRes.text().catch(() => "");
    throw new Error(`persist project HTTP ${putFullRes.status}: ${text.slice(0, 300)}`);
  }

  cur.status = "publishing";
  saveState(statePath, state);
  log("publishing to gallery...");
  const publishRes = await authedFetch(
    ctx,
    `/api/organizations/${ctx.org}/kits/publish`,
    {
      method: "POST",
      body: JSON.stringify({
        projectId,
        name: entry.name,
        description: entry.description,
        tags: entry.tags ?? [],
        licence: entry.licence ?? "MIT",
        licenceCustom: entry.licenceCustom,
        tier: entry.tier ?? "minimal",
        unlisted: entry.unlisted ?? false,
        include: entry.include ?? {
          components: false,
          fonts: false,
          branding: false,
          context: false,
        },
        publishAs: "layout",
      }),
    },
  );
  if (!publishRes.ok) {
    const text = await publishRes.text().catch(() => "");
    throw new Error(`publish HTTP ${publishRes.status}: ${text.slice(0, 300)}`);
  }
  const published = (await publishRes.json()) as {
    kitId: string;
    slug: string;
    status: string;
    url: string | null;
  };

  cur.kitId = published.kitId;
  cur.kitSlug = published.slug;
  cur.status = "published";
  cur.publishedAt = nowIso();
  cur.error = undefined;
  saveState(statePath, state);
  log(`published → ${published.url ?? `/gallery/${published.slug}`}`);
}

async function main(): Promise<void> {
  const args = parseArgs();
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) {
    console.error("Missing ADMIN_API_KEY env var.");
    process.exit(1);
  }
  const host = HOSTS[args.env];
  const ctx: RequestContext = { host, apiKey, org: args.org };

  const inputPath = path.resolve(args.inputPath);
  const statePath = path.resolve(args.statePath);
  const entries = loadInput(inputPath);
  const state = loadState(statePath);

  console.log(`Batch gallery import → ${args.env} (${host})`);
  console.log(`  input:  ${inputPath} (${entries.length} entries)`);
  console.log(`  state:  ${statePath}`);
  console.log(`  org:    ${args.org}`);
  if (args.limit !== Infinity) console.log(`  limit:  ${args.limit}`);
  if (args.resume) console.log("  resume: skip already-published entries");
  console.log("");

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (processed >= args.limit) break;
    if (args.resume && state[entry.url]?.status === "published") {
      skipped += 1;
      console.log(`⤼ skip (already published): ${entry.name}`);
      continue;
    }
    processed += 1;
    console.log(`[${processed}] ${entry.name}  (${entry.url})`);
    try {
      await processEntry(ctx, entry, state, statePath);
      succeeded += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const cur = state[entry.url];
      if (cur) {
        cur.status = "failed";
        cur.error = message;
        saveState(statePath, state);
      }
      failed += 1;
      console.error(`  failed: ${message}`);
    }
    console.log("");
  }

  console.log("─────────────────────────────────────");
  console.log(`Done. ${succeeded} published, ${failed} failed, ${skipped} skipped.`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

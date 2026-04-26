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

const CARD_IMAGES_DIR = "scripts/data/card-images";
const CARD_IMAGE_MIMES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

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
  /**
   * Filename inside `scripts/data/card-images/` to upload as the kit's
   * custom card image after publish. Must be exactly 1440x1080,
   * PNG/JPG/WEBP, ≤ 8MB. Optional — skip to let the auto-generated hero
   * appear on the gallery card instead.
   */
  cardImage?: string;
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
  cardImageUploaded?: boolean;
  cardImageError?: string;
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

function cardImagePath(filename: string): string {
  return path.resolve(CARD_IMAGES_DIR, filename);
}

function cardImageMime(filename: string): string | null {
  const ext = path.extname(filename).toLowerCase();
  return CARD_IMAGE_MIMES[ext] ?? null;
}

/**
 * POST a card image to /api/admin/kits/{id}/custom-card. Server enforces
 * 1440x1080 PNG/JPG/WEBP at ≤ 8MB; we only handle the auth + multipart
 * envelope. Throws on any non-2xx so callers can surface the message.
 */
async function uploadCardImage(
  ctx: RequestContext,
  kitId: string,
  filename: string,
): Promise<void> {
  const fullPath = cardImagePath(filename);
  if (!existsSync(fullPath)) {
    throw new Error(`card image not found on disk: ${fullPath}`);
  }
  const mime = cardImageMime(filename);
  if (!mime) {
    throw new Error(`unsupported card image extension: ${filename}`);
  }
  const buffer = readFileSync(fullPath);
  // Node 20+ has native FormData/Blob — both behave like the browser globals
  // for fetch() multipart bodies.
  const form = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: mime });
  form.append("file", blob, path.basename(filename));

  const res = await fetch(`${ctx.host}/api/admin/kits/${kitId}/custom-card`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ctx.apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`custom-card HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
}

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

  // Custom card image upload runs AFTER publish so the kit row exists. A
  // failure here doesn't roll the kit back — the published kit just falls
  // through to the auto card-image chain. Re-run with --resume and the
  // upload retries (state guard below).
  if (entry.cardImage && !cur.cardImageUploaded) {
    log(`uploading card image (${entry.cardImage})...`);
    try {
      await uploadCardImage(ctx, published.kitId, entry.cardImage);
      cur.cardImageUploaded = true;
      cur.cardImageError = undefined;
      saveState(statePath, state);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      cur.cardImageError = message;
      saveState(statePath, state);
      console.warn(`  ⚠ card image upload failed: ${message}`);
    }
  }
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

  // Pre-flight: every cardImage referenced must exist locally. Failing here
  // beats discovering missing files 30 minutes into a run.
  const missingCards: string[] = [];
  const badExtensions: string[] = [];
  for (const e of entries) {
    if (!e.cardImage) continue;
    if (!cardImageMime(e.cardImage)) {
      badExtensions.push(`${e.name}: ${e.cardImage}`);
      continue;
    }
    if (!existsSync(cardImagePath(e.cardImage))) {
      missingCards.push(`${e.name}: ${e.cardImage}`);
    }
  }
  if (badExtensions.length > 0) {
    console.error("Unsupported card image extensions (use .png/.jpg/.jpeg/.webp):");
    for (const m of badExtensions) console.error(`  - ${m}`);
    process.exit(1);
  }
  if (missingCards.length > 0) {
    console.error(
      `Missing ${missingCards.length} card image file(s) under ${path.resolve(CARD_IMAGES_DIR)}:`,
    );
    for (const m of missingCards) console.error(`  - ${m}`);
    console.error("Drop the Dropbox folder contents in that directory and re-run.");
    process.exit(1);
  }

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
    const cached = state[entry.url];
    const isPublished = cached?.status === "published";
    const cardImageDone = !entry.cardImage || cached?.cardImageUploaded === true;

    if (args.resume && isPublished && cardImageDone) {
      skipped += 1;
      console.log(`⤼ skip (already complete): ${entry.name}`);
      continue;
    }

    processed += 1;
    console.log(`[${processed}] ${entry.name}  (${entry.url})`);

    // Already-published kit whose only outstanding work is a failed/missing
    // card image upload — skip the heavy extraction/synth/publish steps and
    // just retry the upload.
    if (args.resume && isPublished && !cardImageDone && entry.cardImage && cached?.kitId) {
      console.log(`  retrying card image upload (${entry.cardImage})...`);
      try {
        await uploadCardImage(ctx, cached.kitId, entry.cardImage);
        cached.cardImageUploaded = true;
        cached.cardImageError = undefined;
        saveState(statePath, state);
        succeeded += 1;
        console.log("  ✔ card image uploaded");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        cached.cardImageError = message;
        saveState(statePath, state);
        failed += 1;
        console.error(`  failed: ${message}`);
      }
      console.log("");
      continue;
    }

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

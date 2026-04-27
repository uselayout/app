#!/usr/bin/env npx tsx
/**
 * One-shot recovery script: copy every storage object referenced by a kit on
 * production from staging, since today's pg_dump-only port left them missing.
 *
 * For each kit row on production:
 *   - preview_image_url               -> screenshots bucket
 *   - hero_image_url                  -> layout-images bucket
 *   - custom_card_image_url           -> layout-images bucket (already done, idempotent)
 *   - rich_bundle.brandingAssets[]    -> branding bucket
 *   - rich_bundle.fonts[]             -> layout-fonts bucket
 *   - author.avatarUrl (if set)       -> user-avatars bucket
 *
 * Source: GET https://staging.layout.design/api/storage/<bucket>/<key>
 *   The studio's storage proxy is public for these read paths.
 *
 * Destination: POST <prodSupabase>/storage/v1/object/<bucket>/<key>
 *   With service-role bearer + apikey + x-upsert: true (idempotent).
 *
 * Usage:
 *   PROD_DATABASE_URL=postgresql://... \
 *   PROD_SUPABASE_URL=http://supabasekong-...sslip.io \
 *   PROD_SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   STAGING_PUBLIC_URL=https://staging.layout.design \
 *   npx tsx scripts/port-kits-storage.ts
 *
 * Idempotent — safe to re-run.
 */

import pg from "pg";

const { Pool } = pg;

const PROD_DATABASE_URL = required("PROD_DATABASE_URL");
const PROD_SUPABASE_URL = required("PROD_SUPABASE_URL").replace(/\/$/, "");
const PROD_SERVICE_ROLE = required("PROD_SUPABASE_SERVICE_ROLE_KEY");
const STAGING_PUBLIC_URL = (
  process.env.STAGING_PUBLIC_URL ?? "https://staging.layout.design"
).replace(/\/$/, "");

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return v;
}

interface KitRow {
  slug: string;
  preview_image_url: string | null;
  hero_image_url: string | null;
  custom_card_image_url: string | null;
  rich_bundle: { brandingAssets?: Array<{ url?: string }>; fonts?: Array<{ url?: string }> } | null;
  kit_json: { author?: { avatarUrl?: string | null } } | null;
}

interface CopyResult {
  copied: number;
  skipped: number;
  failed: number;
  bytes: number;
}

const PROXY_PATH_RE = /^\/api\/storage\/([^/]+)\/(.+)$/;

async function copyOne(sourceUrl: string): Promise<{ ok: boolean; bytes: number; reason?: string }> {
  const m = sourceUrl.match(PROXY_PATH_RE);
  if (!m) return { ok: false, bytes: 0, reason: `unparseable url: ${sourceUrl}` };
  const [, bucket, key] = m;

  const fetchUrl = `${STAGING_PUBLIC_URL}${sourceUrl}`;
  const sourceResp = await fetch(fetchUrl);
  if (!sourceResp.ok) {
    return { ok: false, bytes: 0, reason: `staging fetch ${sourceResp.status}` };
  }
  const buf = Buffer.from(await sourceResp.arrayBuffer());
  const contentType = sourceResp.headers.get("content-type") ?? guessMime(key);

  const uploadUrl = `${PROD_SUPABASE_URL}/storage/v1/object/${bucket}/${key}`;
  const upResp = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PROD_SERVICE_ROLE}`,
      apikey: PROD_SERVICE_ROLE,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: buf,
  });

  if (!upResp.ok) {
    return { ok: false, bytes: 0, reason: `prod upload ${upResp.status}: ${await upResp.text()}` };
  }
  return { ok: true, bytes: buf.length };
}

function guessMime(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "webp": return "image/webp";
    case "svg": return "image/svg+xml";
    case "woff2": return "font/woff2";
    case "woff": return "font/woff";
    case "ttf": return "font/ttf";
    case "otf": return "font/otf";
    default: return "application/octet-stream";
  }
}

async function copyKit(kit: KitRow): Promise<CopyResult> {
  const urls = collectUrls(kit);
  const result: CopyResult = { copied: 0, skipped: 0, failed: 0, bytes: 0 };

  for (const url of urls) {
    const r = await copyOne(url);
    if (r.ok) {
      result.copied++;
      result.bytes += r.bytes;
    } else {
      // 409 from prod storage = already exists, treat as skipped (we use upsert
      // anyway so this should be rare). 404 from staging = source gone.
      if (r.reason?.startsWith("staging fetch 404")) {
        result.skipped++;
      } else {
        result.failed++;
        console.error(`  ! ${url} — ${r.reason}`);
      }
    }
  }

  return result;
}

function collectUrls(kit: KitRow): string[] {
  const urls: string[] = [];
  if (kit.preview_image_url) urls.push(kit.preview_image_url);
  if (kit.hero_image_url) urls.push(kit.hero_image_url);
  if (kit.custom_card_image_url) urls.push(kit.custom_card_image_url);
  for (const a of kit.rich_bundle?.brandingAssets ?? []) {
    if (a?.url) urls.push(a.url);
  }
  for (const f of kit.rich_bundle?.fonts ?? []) {
    if (f?.url) urls.push(f.url);
  }
  const avatar = kit.kit_json?.author?.avatarUrl;
  if (avatar && PROXY_PATH_RE.test(avatar)) urls.push(avatar);
  return urls;
}

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: PROD_DATABASE_URL });
  try {
    const { rows } = await pool.query<KitRow>(
      `SELECT slug, preview_image_url, hero_image_url, custom_card_image_url,
              rich_bundle, kit_json
         FROM layout_public_kit
         ORDER BY slug`,
    );
    console.log(`Porting storage for ${rows.length} kits on prod...`);
    let totalCopied = 0, totalSkipped = 0, totalFailed = 0, totalBytes = 0;
    for (const kit of rows) {
      const urls = collectUrls(kit);
      if (urls.length === 0) {
        console.log(`  ${kit.slug}: no storage refs`);
        continue;
      }
      const r = await copyKit(kit);
      console.log(
        `  ${kit.slug}: ${r.copied} copied (${(r.bytes / 1024).toFixed(1)}kb)` +
          (r.skipped ? `, ${r.skipped} skipped` : "") +
          (r.failed ? `, ${r.failed} FAILED` : ""),
      );
      totalCopied += r.copied;
      totalSkipped += r.skipped;
      totalFailed += r.failed;
      totalBytes += r.bytes;
    }
    console.log(
      `\nDone. ${totalCopied} files copied (${(totalBytes / 1024).toFixed(1)}kb), ` +
        `${totalSkipped} skipped, ${totalFailed} failed.`,
    );
    if (totalFailed > 0) process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

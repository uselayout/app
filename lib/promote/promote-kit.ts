import "server-only";
import type { PublicKit, KitRichBundle } from "@/lib/types/kit";
import { copyStorageObject, type CopyResult } from "./copy-storage-object";

/**
 * Orchestrate the cross-environment promote of a single kit.
 *
 * Two phases:
 *   1. POST the full kit row to the destination's `/api/admin/kits/import`
 *      endpoint with bearer auth. That endpoint inserts (or upserts on
 *      overwrite) into `layout_public_kit` on the destination DB.
 *   2. Copy every storage object the kit references — the URL columns AND
 *      every entry in rich_bundle.brandingAssets / rich_bundle.fonts — from
 *      this environment's storage proxy to the destination's Supabase.
 *
 * All storage uploads use x-upsert so the operation is idempotent. If a
 * storage copy fails we keep going and report it in the result; the DB row
 * is the durable artifact.
 */

const PROXY_PATH_RE = /^\/api\/storage\/[^/]+\/.+$/;

export interface PromoteOptions {
  kit: PublicKit;
  /** Origin of the destination Studio app (e.g. https://layout.design). */
  destAppUrl: string;
  /** Bearer token recognised by the destination's admin-bearer auth. */
  destAdminApiKey: string;
  /** Origin of the destination Supabase. */
  destSupabaseUrl: string;
  /** Service-role key for the destination Supabase. */
  destServiceRole: string;
  /** Origin where THIS environment's storage proxy is reachable
   *  (e.g. https://staging.layout.design). */
  sourceOrigin: string;
  /** When true, allow overwriting an existing row with the same slug on dest. */
  overwrite?: boolean;
}

export interface PromoteResult {
  ok: boolean;
  prodKitId?: string;
  prodSlug?: string;
  prodUrl?: string;
  conflict?: { existingProdUrl: string };
  storage: {
    attempted: number;
    copied: number;
    failed: number;
    bytes: number;
    failures: Array<{ url: string; reason: string }>;
  };
  durationMs: number;
  error?: string;
}

export async function promoteKit(opts: PromoteOptions): Promise<PromoteResult> {
  const start = Date.now();
  const storageRefs = collectStorageRefs(opts.kit);

  const result: PromoteResult = {
    ok: false,
    storage: {
      attempted: storageRefs.length,
      copied: 0,
      failed: 0,
      bytes: 0,
      failures: [],
    },
    durationMs: 0,
  };

  // Phase 1: import the row
  const importUrl = `${stripTrailingSlash(opts.destAppUrl)}/api/admin/kits/import${opts.overwrite ? "?overwrite=true" : ""}`;
  const importResp = await fetch(importUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.destAdminApiKey}`,
    },
    body: JSON.stringify({ kit: opts.kit }),
  });

  if (importResp.status === 409) {
    const body = (await importResp.json().catch(() => ({}))) as {
      existingProdUrl?: string;
    };
    result.conflict = {
      existingProdUrl: body.existingProdUrl ?? `${opts.destAppUrl}/gallery/${opts.kit.slug}`,
    };
    result.error = "slug_exists";
    result.durationMs = Date.now() - start;
    return result;
  }

  if (!importResp.ok) {
    const text = await importResp.text();
    result.error = `import failed ${importResp.status}: ${text.slice(0, 300)}`;
    result.durationMs = Date.now() - start;
    return result;
  }

  const importBody = (await importResp.json()) as {
    kitId: string;
    slug: string;
    url: string;
  };
  result.prodKitId = importBody.kitId;
  result.prodSlug = importBody.slug;
  result.prodUrl = importBody.url;

  // Phase 2: copy each storage object
  for (const sourceUrl of storageRefs) {
    const copy = await copyStorageObject({
      sourceUrl,
      sourceOrigin: opts.sourceOrigin,
      destSupabaseUrl: opts.destSupabaseUrl,
      destServiceRole: opts.destServiceRole,
    });
    recordCopy(result.storage, sourceUrl, copy);
  }

  // Even if some storage copies failed, the row landed — return ok:true and
  // surface failures so the UI can warn. This matches today's manual port
  // pattern: missing files are recoverable by re-running.
  result.ok = true;
  result.durationMs = Date.now() - start;
  return result;
}

function recordCopy(
  storage: PromoteResult["storage"],
  sourceUrl: string,
  copy: CopyResult,
): void {
  if (copy.ok) {
    storage.copied++;
    storage.bytes += copy.bytes;
  } else {
    storage.failed++;
    storage.failures.push({ url: sourceUrl, reason: copy.reason ?? "unknown" });
  }
}

/**
 * Walk the kit and return every storage proxy URL it references.
 * Order: direct URL columns first, then rich_bundle arrays. Skips nulls,
 * skips external URLs (anything not matching `/api/storage/<bucket>/<key>`).
 */
export function collectStorageRefs(kit: PublicKit): string[] {
  const refs: string[] = [];

  pushIfProxyUrl(refs, kit.previewImageUrl);
  pushIfProxyUrl(refs, kit.heroImageUrl);
  pushIfProxyUrl(refs, kit.customCardImageUrl);
  pushIfProxyUrl(refs, kit.author?.avatarUrl);

  const rich = kit.richBundle as KitRichBundle | undefined;
  for (const a of rich?.brandingAssets ?? []) {
    pushIfProxyUrl(refs, a?.url);
  }
  for (const f of rich?.fonts ?? []) {
    pushIfProxyUrl(refs, f?.url);
  }

  // Dedupe — a kit might reference the same asset multiple times.
  return [...new Set(refs)];
}

function pushIfProxyUrl(refs: string[], url: string | undefined | null): void {
  if (!url) return;
  if (!PROXY_PATH_RE.test(url)) return;
  refs.push(url);
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

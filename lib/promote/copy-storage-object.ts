import "server-only";

/**
 * Copy a single storage object from this environment's storage proxy to a
 * remote Supabase instance. Used by the kit-promote orchestrator.
 *
 * Source: GET ${SOURCE_PUBLIC_URL}/api/storage/<bucket>/<key>
 *   The studio's public storage proxy. No auth required for read.
 *
 * Destination: POST <destSupabaseUrl>/storage/v1/object/<bucket>/<key>
 *   With service-role bearer + apikey + x-upsert: true. Idempotent.
 */

const PROXY_PATH_RE = /^\/api\/storage\/([^/]+)\/(.+)$/;

export interface CopyResult {
  ok: boolean;
  bucket: string;
  key: string;
  bytes: number;
  reason?: string;
}

export interface CopyStorageOptions {
  /** A `/api/storage/<bucket>/<key>` URL on the SOURCE environment. */
  sourceUrl: string;
  /** Origin where the source proxy is reachable (e.g. https://staging.layout.design). */
  sourceOrigin: string;
  /** Origin of the destination Supabase (e.g. https://supabasekong-w1rasv0wm54ab3vv0tieobxi.94.130.130.22.sslip.io). */
  destSupabaseUrl: string;
  /** Service-role key for the destination Supabase. */
  destServiceRole: string;
}

export async function copyStorageObject(opts: CopyStorageOptions): Promise<CopyResult> {
  const m = opts.sourceUrl.match(PROXY_PATH_RE);
  if (!m) {
    return {
      ok: false,
      bucket: "",
      key: "",
      bytes: 0,
      reason: `unparseable storage url: ${opts.sourceUrl}`,
    };
  }
  const [, bucket, key] = m;

  const fetchUrl = `${stripTrailingSlash(opts.sourceOrigin)}${opts.sourceUrl}`;
  const sourceResp = await fetch(fetchUrl);
  if (!sourceResp.ok) {
    return {
      ok: false,
      bucket,
      key,
      bytes: 0,
      reason: `source ${sourceResp.status} (${fetchUrl})`,
    };
  }
  const buf = Buffer.from(await sourceResp.arrayBuffer());
  const contentType = sourceResp.headers.get("content-type") ?? guessMime(key);

  const uploadUrl = `${stripTrailingSlash(opts.destSupabaseUrl)}/storage/v1/object/${bucket}/${key}`;
  const upResp = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.destServiceRole}`,
      apikey: opts.destServiceRole,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: buf,
  });

  if (!upResp.ok) {
    const body = await upResp.text();
    return {
      ok: false,
      bucket,
      key,
      bytes: 0,
      reason: `dest ${upResp.status}: ${body.slice(0, 200)}`,
    };
  }

  return { ok: true, bucket, key, bytes: buf.length };
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function guessMime(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "webp": return "image/webp";
    case "svg": return "image/svg+xml";
    case "gif": return "image/gif";
    case "woff2": return "font/woff2";
    case "woff": return "font/woff";
    case "ttf": return "font/ttf";
    case "otf": return "font/otf";
    default: return "application/octet-stream";
  }
}

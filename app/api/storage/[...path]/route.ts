import { NextRequest } from "next/server";
import rateLimit from "@/lib/rate-limit";
import { getClientIp } from "@/lib/get-client-ip";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const storageLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

/**
 * Proxy Supabase Storage requests through the app's own domain.
 * Solves mixed content (HTTPS app loading HTTP Supabase) and basic auth
 * issues (Traefik intercepts rewrites but not API routes with credentials).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Rate limit: 120 requests per minute per IP
  const ip = await getClientIp();
  const { success } = storageLimiter.check(120, ip);
  if (!success) {
    return new Response("Too many requests", { status: 429 });
  }

  const { path } = await params;
  const storagePath = path.join("/");
  const url = `${SUPABASE_URL}/storage/v1/object/public/${storagePath}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return new Response("Not found", { status: 404 });
    }

    // Validate content type: only serve images
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    if (!contentType.startsWith("image/")) {
      return new Response("Invalid content type", { status: 400 });
    }

    // Reject files larger than 10MB
    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return new Response("File too large", { status: 413 });
    }

    const body = await res.arrayBuffer();

    // Double-check size after download (content-length may be absent)
    if (body.byteLength > MAX_FILE_SIZE) {
      return new Response("File too large", { status: 413 });
    }

    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Storage unavailable", { status: 502 });
  }
}

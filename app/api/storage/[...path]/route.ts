import { NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * Proxy Supabase Storage requests through the app's own domain.
 * Solves mixed content (HTTPS app loading HTTP Supabase) and basic auth
 * issues (Traefik intercepts rewrites but not API routes with credentials).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const storagePath = path.join("/");
  const url = `${SUPABASE_URL}/storage/v1/object/public/${storagePath}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return new Response("Not found", { status: 404 });
    }

    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const body = await res.arrayBuffer();

    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Storage unavailable", { status: 502 });
  }
}

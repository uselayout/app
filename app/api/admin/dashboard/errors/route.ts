import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";

const SAFE_METADATA_KEYS = new Set([
  "domain", "projectId", "endpoint", "sourceType", "variantCount", "modelId",
  "hasImageUpload", "hasContextFiles", "contextFileCount", "isRefinement",
  "promptLength", "instructionLength", "editCount", "annotationCount",
  "figmaFileKey", "screenshotCount", "durationMs", "tokenCount", "componentCount",
  "formats", "hasScreenshots", "tool", "fileKey",
]);

function sanitiseMetadata(meta: unknown): Record<string, unknown> | null {
  if (!meta || typeof meta !== "object") return null;
  const raw = meta as Record<string, unknown>;
  const safe: Record<string, unknown> = {};
  for (const key of Object.keys(raw)) {
    if (SAFE_METADATA_KEYS.has(key)) {
      safe[key] = raw[key];
    }
  }
  return Object.keys(safe).length > 0 ? safe : null;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const hours = Math.min(
    Math.max(parseInt(request.nextUrl.searchParams.get("hours") ?? "24", 10) || 24, 1),
    720
  );
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("layout_api_log")
    .select("id, created_at, endpoint, status_code, error_message, user_id, metadata, duration_ms")
    .gte("status_code", 400)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];

  // Matches ErrorEntry interface in DashboardTab
  const errors = rows.map((r) => ({
    timestamp: r.created_at,
    endpoint: r.endpoint,
    status: r.status_code,
    message: r.error_message ?? "",
    userId: r.user_id ?? undefined,
    metadata: sanitiseMetadata(r.metadata) ?? undefined,
  }));

  // Matches ErrorsData interface: countByEndpoint is Record<string, number>
  const countByEndpoint: Record<string, number> = {};
  for (const r of rows) {
    if (r.endpoint) {
      countByEndpoint[r.endpoint] = (countByEndpoint[r.endpoint] ?? 0) + 1;
    }
  }

  return NextResponse.json({ errors, countByEndpoint }, { headers: { "Cache-Control": "no-store, private" } });
}

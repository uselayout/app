import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { supabase } from "@/lib/supabase/client";
import { LIVE_REQUEST_COLUMNS } from "@/lib/supabase/live-requests";
import { logEvent } from "@/lib/logging/platform-event";

// Layout Live multiplayer request sync.
//
// The Live desktop app pushes request lifecycle events here (POST) and pulls
// teammates' requests (GET) using an org API key (Bearer lyt_...). Conflict
// strategy is deliberately last-write-wins for v1: every push overwrites the
// stored row and bumps updated_at to server time. Deletions are soft
// (deleted: true) so they propagate to other devices on delta pulls.

const MAX_PULL_ROWS = 500;
const MAX_PUSH_ROWS = 50;

const GetQuerySchema = z.object({
  project_ref: z.string().min(1).max(500).optional(),
  since: z.iso.datetime({ offset: true }).optional(),
});

const RequestItemSchema = z.object({
  request_id: z.string().min(1).max(200),
  message: z.string().min(1).max(20000),
  status: z.enum(["pending", "in-progress", "done"]),
  target: z.record(z.string(), z.unknown()).optional(),
  history: z.array(z.unknown()).optional(),
  device_label: z.string().max(200).optional(),
  deleted: z.boolean().optional(),
  created_at: z.iso.datetime({ offset: true }).optional(),
});

const PostBodySchema = z.object({
  project_ref: z.string().min(1).max(500),
  requests: z.array(RequestItemSchema).min(1).max(MAX_PUSH_ROWS),
});

export async function GET(request: Request) {
  const authResult = await requireMcpAuth(request, "read");
  if (authResult instanceof NextResponse) return authResult;

  const { orgId } = authResult;

  const url = new URL(request.url);
  const parsed = GetQuerySchema.safeParse({
    project_ref: url.searchParams.get("project_ref") ?? undefined,
    since: url.searchParams.get("since") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { project_ref, since } = parsed.data;

  let query = supabase
    .from("layout_live_requests")
    .select(LIVE_REQUEST_COLUMNS)
    .eq("org_id", orgId)
    .order("updated_at", { ascending: true })
    .limit(MAX_PULL_ROWS);

  if (project_ref) {
    query = query.eq("project_ref", project_ref);
  }

  if (since) {
    // Delta pull: include soft-deleted rows so clients can remove them.
    query = query.gt("updated_at", since);
  } else {
    // Initial full pull: tombstones are noise, skip them.
    query = query.eq("deleted", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[live/requests] pull failed:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch live requests" },
      { status: 500 }
    );
  }

  void logEvent("live.requests.pull", "live", {
    orgId,
    metadata: { projectRef: project_ref ?? null, delta: !!since, count: data?.length ?? 0 },
  });

  return NextResponse.json({
    requests: data ?? [],
    now: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const authResult = await requireMcpAuth(request, "write");
  if (authResult instanceof NextResponse) return authResult;

  const { orgId } = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { project_ref, requests } = parsed.data;
  const nowIso = new Date().toISOString();

  // Dedupe on request_id (last occurrence wins) — Postgres rejects the same
  // primary key appearing twice in one INSERT ... ON CONFLICT statement.
  const byId = new Map<string, (typeof requests)[number]>();
  for (const item of requests) {
    byId.set(item.request_id, item);
  }

  const rows = [...byId.values()].map((item) => ({
    org_id: orgId,
    project_ref,
    request_id: item.request_id,
    message: item.message,
    status: item.status,
    target: item.target ?? {},
    history: item.history ?? [],
    device_label: item.device_label ?? null,
    deleted: item.deleted ?? false,
    // Clients should always send their original created_at; server time is
    // only a fallback for the first push of a brand-new request.
    created_at: item.created_at ?? nowIso,
    updated_at: nowIso,
  }));

  const { error } = await supabase
    .from("layout_live_requests")
    .upsert(rows, { onConflict: "org_id,project_ref,request_id" });

  if (error) {
    console.error("[live/requests] push failed:", error.message);
    return NextResponse.json(
      { error: "Failed to sync live requests" },
      { status: 500 }
    );
  }

  void logEvent("live.requests.push", "live", {
    orgId,
    metadata: { projectRef: project_ref, count: rows.length },
  });

  return NextResponse.json({ upserted: rows.length, now: nowIso });
}

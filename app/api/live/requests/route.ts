import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { supabase } from "@/lib/supabase/client";
import { LIVE_REQUEST_COLUMNS, type LiveRequestRow } from "@/lib/supabase/live-requests";
import { logEvent } from "@/lib/logging/platform-event";

// Layout Live multiplayer request sync.
//
// The Live desktop app pushes request lifecycle events here (POST) and pulls
// teammates' requests (GET) using an org API key (Bearer lyt_...). Conflict
// strategy is deliberately last-write-wins for v1: every push overwrites the
// stored row and the DB bumps updated_at. Deletions are soft (deleted: true)
// so they propagate to other devices on delta pulls.
//
// Cursor contract (all timestamps are DB clock, never app-server clock):
//
// PUSH (POST { project_ref, requests: [...] }):
//   - The body shape is validated as a whole (malformed JSON or a missing
//     project_ref is a 400), but each row is validated individually: invalid
//     rows are reported in `skipped` ([{ request_id?, reason }]) while the
//     valid rows still upsert, so one bad row cannot poison a batch.
//   - Rows are upserted via the layout_live_upsert_requests DB function,
//     which stamps updated_at with clock_timestamp() per row (distinct,
//     monotonic within the call) and never rewrites created_at on conflict.
//   - Response: { upserted, skipped, now } where `now` is the max committed
//     updated_at returned by the upsert, falling back to layout_live_db_now()
//     when zero rows were upserted. Because it is a committed DB timestamp,
//     a client may safely persist it as its pull cursor.
//
// PULL (GET ?project_ref=&since=):
//   - Rows are ordered by (updated_at asc, request_id asc) and filtered with
//     a strict updated_at > since, so pagination has a total order and no
//     tie group can straddle a page boundary undetectably.
//   - `now` in the response is the client's next cursor:
//       * full page (MAX_PULL_ROWS rows): the last row's updated_at, so the
//         next pull resumes exactly where this page ended;
//       * short page: layout_live_db_now() minus a 2 second grace interval.
//     The grace means a client may re-receive rows it has already seen; the
//     Live client dedupes by (request_id, updated_at), so the overlap is
//     harmless, and it closes the commit-visibility race for any upsert
//     whose commit lags its timestamp by under 2 seconds.

const MAX_PULL_ROWS = 500;
const MAX_PUSH_ROWS = 50;
const PULL_CURSOR_GRACE_MS = 2_000;
const MAX_TARGET_JSON_CHARS = 8_192;
const MAX_HISTORY_ITEMS = 50;
const MAX_HISTORY_JSON_CHARS = 32_768;
const MAX_DEVICE_LABEL_CHARS = 200;

const GetQuerySchema = z.object({
  project_ref: z.string().min(1).max(500).optional(),
  since: z.iso.datetime({ offset: true }).optional(),
});

const RequestItemSchema = z.object({
  request_id: z.string().min(1).max(200),
  message: z.string().min(1).max(20000),
  status: z.enum(["pending", "in-progress", "done"]),
  target: z
    .record(z.string(), z.unknown())
    .optional()
    .refine(
      (v) => v === undefined || JSON.stringify(v).length <= MAX_TARGET_JSON_CHARS,
      { message: `target must serialise to at most ${MAX_TARGET_JSON_CHARS} characters` }
    ),
  history: z
    .array(z.unknown())
    .max(MAX_HISTORY_ITEMS)
    .optional()
    .refine(
      (v) => v === undefined || JSON.stringify(v).length <= MAX_HISTORY_JSON_CHARS,
      { message: `history must serialise to at most ${MAX_HISTORY_JSON_CHARS} characters` }
    ),
  // Over-long labels are truncated rather than rejected: the label is
  // display-only and must never cost a batch its lifecycle data.
  device_label: z
    .string()
    .optional()
    .transform((v) => v?.slice(0, MAX_DEVICE_LABEL_CHARS)),
  deleted: z.boolean().optional(),
  created_at: z.iso.datetime({ offset: true }).optional(),
});

// Rows are unknown at the top level so a single malformed row lands in
// `skipped` instead of failing the whole batch with a 400.
const PostBodySchema = z.object({
  project_ref: z.string().min(1).max(500),
  requests: z.array(z.unknown()).min(1).max(MAX_PUSH_ROWS),
});

// Shape returned by the layout_live_upsert_requests DB function.
const UpsertResultsSchema = z.array(
  z.object({
    request_id: z.string(),
    updated_at: z.string(),
  })
);

interface SkippedRow {
  request_id?: string;
  reason: string;
}

// Later of two Postgres timestamptz strings. clock_timestamp() has
// microsecond precision, so Date.parse (millisecond) can tie; within a tie
// the fixed "+00:00" ISO format from PostgREST compares correctly as a
// string on the fractional-second digits.
function laterIso(a: string, b: string): string {
  const pa = Date.parse(a);
  const pb = Date.parse(b);
  if (pa !== pb) return pb > pa ? b : a;
  return b > a ? b : a;
}

async function fetchDbNow(): Promise<string | null> {
  const { data, error } = await supabase.rpc("layout_live_db_now");
  if (error) {
    console.error("[live/requests] db_now failed:", error.message);
    return null;
  }
  const parsed = z.string().safeParse(data);
  return parsed.success ? parsed.data : null;
}

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
    .order("request_id", { ascending: true })
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

  const rows: LiveRequestRow[] = data ?? [];

  let nowIso: string;
  if (rows.length === MAX_PULL_ROWS) {
    // Full page: resume from the last row. Ordering is (updated_at,
    // request_id) with per-row distinct DB timestamps, so the strict gt
    // filter continues exactly where this page ended.
    nowIso = rows[rows.length - 1].updated_at;
  } else {
    const dbNow = await fetchDbNow();
    if (!dbNow) {
      return NextResponse.json(
        { error: "Failed to read server time" },
        { status: 500 }
      );
    }
    // Back-date the cursor so rows whose commit lags their DB timestamp
    // (in-flight upserts) are re-delivered on the next pull rather than
    // permanently skipped. Overlap is harmless: clients dedupe by
    // (request_id, updated_at).
    nowIso = new Date(Date.parse(dbNow) - PULL_CURSOR_GRACE_MS).toISOString();
  }

  void logEvent("live.requests.pull", "live", {
    orgId,
    metadata: { projectRef: project_ref ?? null, delta: !!since, count: rows.length },
  });

  return NextResponse.json({
    requests: rows,
    now: nowIso,
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

  // Per-row validation: bad rows are skipped (and reported), good rows sync.
  const skipped: SkippedRow[] = [];
  const valid: z.infer<typeof RequestItemSchema>[] = [];
  for (const raw of requests) {
    const row = RequestItemSchema.safeParse(raw);
    if (row.success) {
      valid.push(row.data);
      continue;
    }
    const rawId =
      typeof raw === "object" && raw !== null && "request_id" in raw
        ? (raw as { request_id: unknown }).request_id
        : undefined;
    const issue = row.error.issues[0];
    skipped.push({
      ...(typeof rawId === "string" && { request_id: rawId.slice(0, 200) }),
      reason: issue ? `${issue.path.join(".") || "row"}: ${issue.message}` : "invalid row",
    });
  }

  // Dedupe on request_id (last occurrence wins) — Postgres rejects the same
  // primary key appearing twice in one INSERT ... ON CONFLICT statement.
  const byId = new Map<string, (typeof valid)[number]>();
  for (const item of valid) {
    byId.set(item.request_id, item);
  }

  const rows = [...byId.values()].map((item) => ({
    request_id: item.request_id,
    message: item.message,
    status: item.status,
    target: item.target ?? {},
    history: item.history ?? [],
    device_label: item.device_label ?? null,
    deleted: item.deleted ?? false,
    // Fallback to DB now() happens inside the function; the function never
    // rewrites created_at for an existing row, so this only matters on the
    // first push of a brand-new request.
    created_at: item.created_at ?? null,
  }));

  let nowIso: string | null = null;
  let upserted = 0;

  if (rows.length > 0) {
    const { data, error } = await supabase.rpc("layout_live_upsert_requests", {
      p_org_id: orgId,
      p_project_ref: project_ref,
      p_rows: rows,
    });

    if (error) {
      console.error("[live/requests] push failed:", error.message);
      return NextResponse.json(
        { error: "Failed to sync live requests" },
        { status: 500 }
      );
    }

    const results = UpsertResultsSchema.safeParse(data);
    if (!results.success) {
      console.error("[live/requests] unexpected upsert result shape");
      return NextResponse.json(
        { error: "Failed to sync live requests" },
        { status: 500 }
      );
    }

    upserted = results.data.length;
    for (const row of results.data) {
      nowIso = nowIso === null ? row.updated_at : laterIso(nowIso, row.updated_at);
    }
  }

  if (nowIso === null) {
    // Nothing upserted (every row was skipped): still return a committed
    // DB timestamp so clients can safely persist it as a cursor.
    nowIso = await fetchDbNow();
    if (!nowIso) {
      return NextResponse.json(
        { error: "Failed to read server time" },
        { status: 500 }
      );
    }
  }

  void logEvent("live.requests.push", "live", {
    orgId,
    metadata: { projectRef: project_ref, count: upserted, skipped: skipped.length },
  });

  return NextResponse.json({ upserted, skipped, now: nowIso });
}

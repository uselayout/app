import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/api/mcp-auth", () => ({
  requireMcpAuth: vi.fn(),
}));

const rpcMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock("@/lib/logging/platform-event", () => ({
  logEvent: vi.fn(),
}));

import { GET, POST } from "./route";
import { requireMcpAuth, type McpAuthResult } from "@/lib/api/mcp-auth";

const mockRequireMcpAuth = vi.mocked(requireMcpAuth);

const AUTH: McpAuthResult = {
  orgId: "org-1",
  keyId: "key-1",
  userId: "u1",
  scopes: ["read", "write"],
};

// Thenable chainable query builder: every method returns the builder, and
// awaiting it resolves to the given result.
interface QueryMock {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  then: (resolve: (r: { data: unknown; error: unknown }) => unknown) => unknown;
}

function makeQueryMock(result: { data: unknown; error: unknown }): QueryMock {
  const query = {} as QueryMock;
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.gt = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.limit = vi.fn(() => query);
  query.then = (resolve) => resolve(result);
  return query;
}

function makePost(body: unknown): Request {
  return new Request("http://localhost/api/live/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function makeGet(params: Record<string, string> = {}): Request {
  const url = new URL("http://localhost/api/live/requests");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Request(url, { method: "GET" });
}

function validItem(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    request_id: "req-1",
    message: "Align this button to the primary style",
    status: "pending",
    ...overrides,
  };
}

function dbRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    project_ref: "kit-abc",
    request_id: "req-1",
    message: "msg",
    status: "pending",
    target: {},
    history: [],
    device_label: null,
    deleted: false,
    created_at: "2026-07-10T09:00:00+00:00",
    updated_at: "2026-07-10T09:05:00+00:00",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireMcpAuth.mockResolvedValue(AUTH);
});

// ─── POST ─────────────────────────────────────────────────────────────────────

describe("POST", () => {
  it("returns 400 for invalid JSON", async () => {
    const res = await POST(makePost("not-json{{"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when project_ref is missing", async () => {
    const res = await POST(makePost({ requests: [validItem()] }));
    expect(res.status).toBe(400);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("upserts via the RPC and returns the max committed updated_at as now", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        { request_id: "req-1", updated_at: "2026-07-10T10:00:00.000100+00:00" },
        { request_id: "req-2", updated_at: "2026-07-10T10:00:00.000200+00:00" },
      ],
      error: null,
    });

    const res = await POST(
      makePost({
        project_ref: "kit-abc",
        requests: [validItem(), validItem({ request_id: "req-2" })],
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      upserted: 2,
      skipped: [],
      now: "2026-07-10T10:00:00.000200+00:00",
    });

    expect(rpcMock).toHaveBeenCalledTimes(1);
    const [fn, params] = rpcMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(fn).toBe("layout_live_upsert_requests");
    expect(params.p_org_id).toBe("org-1");
    expect(params.p_project_ref).toBe("kit-abc");
    expect(params.p_rows).toHaveLength(2);
  });

  it("skips invalid rows but still upserts the valid ones", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ request_id: "req-1", updated_at: "2026-07-10T10:00:00+00:00" }],
      error: null,
    });

    const res = await POST(
      makePost({
        project_ref: "kit-abc",
        requests: [
          validItem(),
          { request_id: "req-bad", message: "", status: "pending" },
          "not-an-object",
        ],
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.upserted).toBe(1);
    expect(body.skipped).toHaveLength(2);
    expect(body.skipped[0].request_id).toBe("req-bad");
    expect(typeof body.skipped[0].reason).toBe("string");
    expect(body.skipped[1].request_id).toBeUndefined();

    const [, params] = rpcMock.mock.calls[0] as [string, { p_rows: unknown[] }];
    expect(params.p_rows).toHaveLength(1);
  });

  it("skips rows whose target serialises over the cap", async () => {
    rpcMock.mockResolvedValueOnce({ data: "2026-07-10T10:00:00+00:00", error: null });

    const res = await POST(
      makePost({
        project_ref: "kit-abc",
        requests: [validItem({ target: { blob: "x".repeat(9000) } })],
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.upserted).toBe(0);
    expect(body.skipped).toHaveLength(1);
    expect(body.skipped[0].reason).toMatch(/target/);
    // Zero valid rows: only the db_now RPC runs.
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock.mock.calls[0][0]).toBe("layout_live_db_now");
    expect(body.now).toBe("2026-07-10T10:00:00+00:00");
  });

  it("skips rows with more than 50 history items or oversized history", async () => {
    rpcMock.mockResolvedValueOnce({ data: "2026-07-10T10:00:00+00:00", error: null });

    const res = await POST(
      makePost({
        project_ref: "kit-abc",
        requests: [
          validItem({ history: Array.from({ length: 51 }, () => ({ s: "pending" })) }),
          validItem({ request_id: "req-2", history: [{ note: "y".repeat(40000) }] }),
        ],
      })
    );

    const body = await res.json();
    expect(body.upserted).toBe(0);
    expect(body.skipped).toHaveLength(2);
    expect(body.skipped.map((s: { reason: string }) => s.reason).join(" ")).toMatch(/history/);
  });

  it("truncates over-long device_label instead of rejecting the row", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ request_id: "req-1", updated_at: "2026-07-10T10:00:00+00:00" }],
      error: null,
    });

    const res = await POST(
      makePost({
        project_ref: "kit-abc",
        requests: [validItem({ device_label: "L".repeat(250) })],
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.upserted).toBe(1);
    expect(body.skipped).toEqual([]);

    const [, params] = rpcMock.mock.calls[0] as [string, { p_rows: { device_label: string }[] }];
    expect(params.p_rows[0].device_label).toHaveLength(200);
  });

  it("dedupes duplicate request_ids, last occurrence wins", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ request_id: "req-1", updated_at: "2026-07-10T10:00:00+00:00" }],
      error: null,
    });

    await POST(
      makePost({
        project_ref: "kit-abc",
        requests: [validItem({ status: "pending" }), validItem({ status: "done" })],
      })
    );

    const [, params] = rpcMock.mock.calls[0] as [string, { p_rows: { status: string }[] }];
    expect(params.p_rows).toHaveLength(1);
    expect(params.p_rows[0].status).toBe("done");
  });

  it("returns 500 when the upsert RPC fails", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "boom" } });

    const res = await POST(
      makePost({ project_ref: "kit-abc", requests: [validItem()] })
    );

    expect(res.status).toBe(500);
  });
});

// ─── GET ──────────────────────────────────────────────────────────────────────

describe("GET", () => {
  it("orders by updated_at then request_id and applies the strict since filter", async () => {
    const query = makeQueryMock({ data: [dbRow()], error: null });
    fromMock.mockReturnValueOnce(query);
    rpcMock.mockResolvedValueOnce({ data: "2026-07-10T10:00:10+00:00", error: null });

    const res = await GET(
      makeGet({ project_ref: "kit-abc", since: "2026-07-10T09:00:00+00:00" })
    );

    expect(res.status).toBe(200);
    expect(query.order).toHaveBeenNthCalledWith(1, "updated_at", { ascending: true });
    expect(query.order).toHaveBeenNthCalledWith(2, "request_id", { ascending: true });
    expect(query.gt).toHaveBeenCalledWith("updated_at", "2026-07-10T09:00:00+00:00");
  });

  it("returns DB time minus the 2s grace as now when the page is not full", async () => {
    const query = makeQueryMock({ data: [dbRow()], error: null });
    fromMock.mockReturnValueOnce(query);
    rpcMock.mockResolvedValueOnce({ data: "2026-07-10T10:00:10+00:00", error: null });

    const res = await GET(makeGet());
    const body = await res.json();

    expect(rpcMock).toHaveBeenCalledWith("layout_live_db_now");
    expect(body.now).toBe("2026-07-10T10:00:08.000Z");
    expect(body.requests).toHaveLength(1);
  });

  it("returns the last row's updated_at as now when the page is full", async () => {
    const rows = Array.from({ length: 500 }, (_, i) =>
      dbRow({
        request_id: `req-${i}`,
        updated_at: `2026-07-10T10:00:00.${String(i).padStart(3, "0")}+00:00`,
      })
    );
    const query = makeQueryMock({ data: rows, error: null });
    fromMock.mockReturnValueOnce(query);

    const res = await GET(makeGet());
    const body = await res.json();

    expect(body.now).toBe("2026-07-10T10:00:00.499+00:00");
    // Full page must not consult the DB clock.
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid since parameter", async () => {
    const res = await GET(makeGet({ since: "yesterday" }));
    expect(res.status).toBe(400);
  });

  it("returns 500 when the query fails", async () => {
    const query = makeQueryMock({ data: null, error: { message: "boom" } });
    fromMock.mockReturnValueOnce(query);

    const res = await GET(makeGet());
    expect(res.status).toBe(500);
  });
});

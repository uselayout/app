import { describe, expect, it } from "vitest";
import { rowToLiveSyncRequest, type LiveRequestRow } from "./live-requests";

function baseRow(overrides: Partial<LiveRequestRow> = {}): LiveRequestRow {
  return {
    project_ref: "kit-abc",
    request_id: "req-1",
    message: "Make this button match the primary style",
    status: "pending",
    target: { file: "src/App.tsx", line: 42 },
    history: [{ status: "pending", at: "2026-07-10T09:00:00.000Z" }],
    device_label: "Matt's MacBook",
    deleted: false,
    created_at: "2026-07-10T09:00:00.000Z",
    updated_at: "2026-07-10T09:05:00.000Z",
    ...overrides,
  };
}

describe("rowToLiveSyncRequest", () => {
  it("maps snake_case row to camelCase LiveSyncRequest", () => {
    const result = rowToLiveSyncRequest(baseRow());

    expect(result).toEqual({
      projectRef: "kit-abc",
      requestId: "req-1",
      message: "Make this button match the primary style",
      status: "pending",
      target: { file: "src/App.tsx", line: 42 },
      history: [{ status: "pending", at: "2026-07-10T09:00:00.000Z" }],
      deviceLabel: "Matt's MacBook",
      deleted: false,
      createdAt: "2026-07-10T09:00:00.000Z",
      updatedAt: "2026-07-10T09:05:00.000Z",
    });
  });

  it("falls back to empty target/history when the row carries nulls", () => {
    // Rows written before a column existed, or via raw SQL, can carry nulls
    // despite the NOT NULL defaults on fresh inserts.
    const row = baseRow({
      target: null as unknown as Record<string, unknown>,
      history: null as unknown as unknown[],
      device_label: null,
    });

    const result = rowToLiveSyncRequest(row);

    expect(result.target).toEqual({});
    expect(result.history).toEqual([]);
    expect(result.deviceLabel).toBeNull();
  });
});

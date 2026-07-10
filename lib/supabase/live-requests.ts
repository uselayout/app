import type { LiveRequestStatus, LiveSyncRequest } from "@/lib/types/live-request";

/**
 * Wire/row shape for layout_live_requests (org_id excluded, it is implicit
 * in the authenticated request). The machine API at /api/live/requests
 * returns rows in this snake_case shape so the Live client pushes and pulls
 * the same field names.
 */
export interface LiveRequestRow {
  project_ref: string;
  request_id: string;
  message: string;
  status: LiveRequestStatus;
  target: Record<string, unknown>;
  history: unknown[];
  device_label: string | null;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

export const LIVE_REQUEST_COLUMNS =
  "project_ref, request_id, message, status, target, history, device_label, deleted, created_at, updated_at";

export function rowToLiveSyncRequest(row: LiveRequestRow): LiveSyncRequest {
  return {
    projectRef: row.project_ref,
    requestId: row.request_id,
    message: row.message,
    status: row.status,
    target: row.target ?? {},
    history: row.history ?? [],
    deviceLabel: row.device_label,
    deleted: row.deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type LiveRequestStatus = "pending" | "in-progress" | "done";

/**
 * A Layout Live "AI request" synced to the shared org queue.
 *
 * Pushed by the Live desktop app via POST /api/live/requests, pulled by
 * teammates via GET /api/live/requests, and shown on the org dashboard at
 * /{org}/live-requests. Soft-deleted rows (deleted: true) are kept so
 * deletions propagate to other devices on delta pulls.
 */
export interface LiveSyncRequest {
  /** Kit/project id if known, else a stable hash of the project path. */
  projectRef: string;
  /** Client-generated id, unique within (org, projectRef). */
  requestId: string;
  message: string;
  status: LiveRequestStatus;
  /** Element the request is pinned to (e.g. { file, line, selector }). */
  target: Record<string, unknown>;
  history: unknown[];
  /** Who pinned it, e.g. "Matt's MacBook". */
  deviceLabel: string | null;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

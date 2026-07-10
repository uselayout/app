-- 060: Layout Live multiplayer request sync
--
-- Shared cloud queue for the "AI requests" users pin to elements in Layout
-- Live. The Live app pushes request lifecycle events here and pulls
-- teammates' requests; the studio dashboard shows the team's queue at
-- /<org>/live-requests.
--
-- project_ref is a client-supplied identifier: the project's kit/project id
-- if known, else a stable hash of the project path. Deliberately no FK, as
-- teams may sync projects that are not Studio projects.
--
-- Rows are soft-deleted (deleted = true) so deletions propagate to other
-- devices on delta pulls. The (org_id, updated_at) index serves those
-- delta pulls (updated_at > cursor).
--
-- Apply to staging:
--   cat migrations/060_layout_live_requests.sql | \
--     ssh root@94.130.130.22 "docker exec -i supabase-db-<service> psql -U postgres"

CREATE TABLE IF NOT EXISTS layout_live_requests (
  org_id       UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  project_ref  TEXT NOT NULL,
  request_id   TEXT NOT NULL,
  message      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'done')),
  target       JSONB NOT NULL DEFAULT '{}',
  history      JSONB NOT NULL DEFAULT '[]',
  device_label TEXT,
  deleted      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, project_ref, request_id)
);

CREATE INDEX IF NOT EXISTS idx_live_requests_org_updated
  ON layout_live_requests (org_id, updated_at);

-- Server uses the service_role key (bypasses RLS); the anon key gets no
-- access. Same posture as migration 027.
ALTER TABLE layout_live_requests ENABLE ROW LEVEL SECURITY;

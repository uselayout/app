-- Migration 014: Drift reports

CREATE TABLE IF NOT EXISTS layout_drift_report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES layout_projects(id) ON DELETE SET NULL,

  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('figma', 'website')),

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  changes JSONB NOT NULL DEFAULT '[]',
  summary TEXT,

  token_additions INT DEFAULT 0,
  token_changes INT DEFAULT 0,
  token_removals INT DEFAULT 0,

  detected_at TIMESTAMPTZ DEFAULT now(),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_drift_org ON layout_drift_report (org_id);
CREATE INDEX IF NOT EXISTS idx_drift_status ON layout_drift_report (org_id, status);

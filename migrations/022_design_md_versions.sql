-- Migration 022: DESIGN.md version history
-- Stores snapshots of DESIGN.md before overwrite so users can restore previous versions

CREATE TABLE IF NOT EXISTS layout_design_md_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  design_md TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'generation', 'extraction')),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_design_md_versions_project
  ON layout_design_md_versions (project_id, created_at DESC);

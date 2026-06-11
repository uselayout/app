-- Migration 018: Project-scoped libraries
-- Creates layout_token (migrations 010 + 017 were never run), adds project_id
-- to components, and sets up project-scoped unique constraints.

-- ── 1. Create layout_token table (from 010 + 017, with project_id as TEXT) ──

CREATE TABLE IF NOT EXISTS layout_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES layout_projects(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  css_variable TEXT,

  type TEXT NOT NULL CHECK (type IN ('color', 'typography', 'spacing', 'radius', 'effect', 'motion')),
  category TEXT NOT NULL DEFAULT 'primitive' CHECK (category IN ('primitive', 'semantic', 'component')),
  value TEXT NOT NULL,
  resolved_value TEXT,

  group_name TEXT,
  sort_order INT DEFAULT 0,

  description TEXT,
  source TEXT CHECK (source IN ('extracted', 'manual', 'figma-variable')),

  last_synced_at TIMESTAMPTZ,
  modified_locally BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, project_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_token_org ON layout_token (org_id);
CREATE INDEX IF NOT EXISTS idx_token_type ON layout_token (org_id, type);
CREATE INDEX IF NOT EXISTS idx_token_project ON layout_token (org_id, project_id);

-- ── 2. Add project_id to layout_component ───────────────────────────────────

ALTER TABLE layout_component
  ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES layout_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_component_project ON layout_component (org_id, project_id);

-- ── 3. Change component unique constraint to project-scoped ─────────────────

ALTER TABLE layout_component DROP CONSTRAINT IF EXISTS layout_component_org_id_slug_key;
ALTER TABLE layout_component ADD CONSTRAINT layout_component_org_project_slug_key UNIQUE(org_id, project_id, slug);

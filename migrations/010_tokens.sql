-- Migration 010: Design tokens

CREATE TABLE IF NOT EXISTS layout_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  project_id UUID REFERENCES layout_projects(id) ON DELETE SET NULL,

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

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_token_org ON layout_token (org_id);
CREATE INDEX IF NOT EXISTS idx_token_type ON layout_token (org_id, type);

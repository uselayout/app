-- Migration 007: Component registry tables

CREATE TABLE IF NOT EXISTS layout_component (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'uncategorised',
  tags TEXT[] DEFAULT '{}',

  -- Code
  code TEXT NOT NULL,
  compiled_js TEXT,

  -- Props & states (structured metadata)
  props JSONB NOT NULL DEFAULT '[]',
  variants JSONB NOT NULL DEFAULT '[]',
  states JSONB NOT NULL DEFAULT '[]',

  -- Design token dependencies
  tokens_used TEXT[] DEFAULT '{}',

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'deprecated')),
  version INT NOT NULL DEFAULT 1,

  -- Provenance
  created_by TEXT,
  source TEXT CHECK (source IN ('manual', 'explorer', 'extraction', 'figma')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_component_org ON layout_component (org_id);
CREATE INDEX IF NOT EXISTS idx_component_org_status ON layout_component (org_id, status);
CREATE INDEX IF NOT EXISTS idx_component_org_category ON layout_component (org_id, category);

CREATE TABLE IF NOT EXISTS layout_component_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID NOT NULL REFERENCES layout_component(id) ON DELETE CASCADE,
  version INT NOT NULL,
  code TEXT NOT NULL,
  props JSONB NOT NULL DEFAULT '[]',
  variants JSONB NOT NULL DEFAULT '[]',
  states JSONB NOT NULL DEFAULT '[]',
  changed_by TEXT,
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(component_id, version)
);

CREATE INDEX IF NOT EXISTS idx_component_version_component ON layout_component_version (component_id);

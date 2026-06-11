-- Migration 012: Icons

CREATE TABLE IF NOT EXISTS layout_icon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',

  svg TEXT NOT NULL,
  viewbox TEXT NOT NULL DEFAULT '0 0 24 24',

  sizes JSONB DEFAULT '[24]',
  stroke_width NUMERIC DEFAULT 2,

  source TEXT CHECK (source IN ('upload', 'figma', 'library')),
  library_name TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_icon_org ON layout_icon (org_id);
CREATE INDEX IF NOT EXISTS idx_icon_category ON layout_icon (org_id, category);

-- Migration 011: Typography

CREATE TABLE IF NOT EXISTS layout_typeface (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  family TEXT NOT NULL,
  source TEXT CHECK (source IN ('google', 'custom', 'system', 'extracted')),
  google_fonts_url TEXT,
  weights TEXT[] DEFAULT '{}',
  role TEXT CHECK (role IN ('heading', 'body', 'mono', 'display', 'accent')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, family)
);

CREATE TABLE IF NOT EXISTS layout_type_scale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  typeface_id UUID NOT NULL REFERENCES layout_typeface(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  font_size TEXT NOT NULL,
  font_weight TEXT NOT NULL,
  line_height TEXT NOT NULL,
  letter_spacing TEXT DEFAULT '0',
  text_transform TEXT,

  sort_order INT DEFAULT 0,

  UNIQUE(org_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_typeface_org ON layout_typeface (org_id);
CREATE INDEX IF NOT EXISTS idx_type_scale_org ON layout_type_scale (org_id);

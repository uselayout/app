-- Migration 016: Design system templates

CREATE TABLE IF NOT EXISTS layout_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  long_description TEXT,

  source_org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  preview_image TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',

  token_count INT DEFAULT 0,
  component_count INT DEFAULT 0,
  typeface_count INT DEFAULT 0,
  icon_count INT DEFAULT 0,
  fork_count INT DEFAULT 0,

  is_free BOOLEAN DEFAULT true,
  price_cents INT DEFAULT 0,

  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  featured BOOLEAN DEFAULT false,

  author_name TEXT,
  author_url TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_template_published ON layout_template (is_published, featured);
CREATE INDEX IF NOT EXISTS idx_template_category ON layout_template (category) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_template_source ON layout_template (source_org_id);

-- Atomic fork count increment to avoid TOCTOU race conditions
CREATE OR REPLACE FUNCTION increment_template_fork_count(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE layout_template
  SET fork_count = fork_count + 1, updated_at = now()
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

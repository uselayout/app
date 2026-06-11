CREATE TABLE layout_figma_capture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  tree JSONB NOT NULL,
  url TEXT,
  title TEXT,
  consumed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_figma_capture_org ON layout_figma_capture(org_id, consumed);

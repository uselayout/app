-- Migration 008: Candidate approval workflow

CREATE TABLE IF NOT EXISTS layout_candidate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'uncategorised',

  -- Link to existing component (null = new component proposal)
  component_id UUID REFERENCES layout_component(id) ON DELETE SET NULL,

  -- AI generation context
  prompt TEXT NOT NULL,
  design_md_snapshot TEXT,

  -- Variants (each is a code option)
  variants JSONB NOT NULL DEFAULT '[]',

  -- Selected variant (index into variants array, set on approval)
  selected_variant_index INT,

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),

  -- People
  created_by TEXT NOT NULL,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_org ON layout_candidate (org_id);
CREATE INDEX IF NOT EXISTS idx_candidate_org_status ON layout_candidate (org_id, status);
CREATE INDEX IF NOT EXISTS idx_candidate_component ON layout_candidate (component_id);

CREATE TABLE IF NOT EXISTS layout_candidate_comment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES layout_candidate(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  author_name TEXT,
  body TEXT NOT NULL,
  variant_index INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_comment_candidate ON layout_candidate_comment (candidate_id);

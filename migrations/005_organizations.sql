-- Migration 005: Organisation model
-- Every user gets a personal org. All entities become org-scoped.

-- Organisations
CREATE TABLE IF NOT EXISTS layout_organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  owner_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_slug ON layout_organization (slug);
CREATE INDEX IF NOT EXISTS idx_org_owner ON layout_organization (owner_id);

-- Organisation members (join table with roles)
CREATE TABLE IF NOT EXISTS layout_organization_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_member_user ON layout_organization_member (user_id);
CREATE INDEX IF NOT EXISTS idx_org_member_org ON layout_organization_member (org_id);

-- Pending invitations
CREATE TABLE IF NOT EXISTS layout_invitation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, email)
);

-- Add org_id to projects (nullable initially for migration, then NOT NULL after backfill)
ALTER TABLE layout_projects ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES layout_organization(id) ON DELETE CASCADE;

-- Add org_id to billing tables
ALTER TABLE layout_subscription ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES layout_organization(id) ON DELETE CASCADE;
ALTER TABLE layout_credit_balance ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES layout_organization(id) ON DELETE CASCADE;
ALTER TABLE layout_usage_log ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES layout_organization(id) ON DELETE CASCADE;

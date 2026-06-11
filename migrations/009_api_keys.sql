-- Migration 009: API key management

CREATE TABLE IF NOT EXISTS layout_api_key (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_preview TEXT NOT NULL,

  -- Scoping
  scopes TEXT[] NOT NULL DEFAULT '{read}',

  -- Tracking
  created_by TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Lifecycle
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_key_org ON layout_api_key (org_id);
CREATE INDEX IF NOT EXISTS idx_api_key_hash ON layout_api_key (key_hash);

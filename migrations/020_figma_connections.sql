-- Figma OAuth connections per organisation
-- Stores OAuth tokens obtained via Figma's OAuth2 flow for use with Figma MCP

CREATE TABLE IF NOT EXISTS layout_figma_connection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,
  figma_user_id TEXT,
  figma_user_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id)
);

-- Index for quick lookups by org
CREATE INDEX IF NOT EXISTS idx_figma_connection_org ON layout_figma_connection(org_id);

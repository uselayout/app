-- Migration 015: Usage analytics

CREATE TABLE IF NOT EXISTS layout_analytics_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'mcp.tool_call', 'component.viewed', 'component.copied',
    'token.exported', 'candidate.generated', 'project.extracted'
  )),
  event_data JSONB DEFAULT '{}',

  api_key_id UUID REFERENCES layout_api_key(id) ON DELETE SET NULL,
  user_id TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_org ON layout_analytics_event (org_id);
CREATE INDEX IF NOT EXISTS idx_analytics_org_type ON layout_analytics_event (org_id, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_org_created ON layout_analytics_event (org_id, created_at DESC);

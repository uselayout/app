-- Migration 013: Audit log

CREATE TABLE IF NOT EXISTS layout_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES layout_organization(id) ON DELETE CASCADE,

  actor_id TEXT NOT NULL,
  actor_name TEXT,
  actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'api_key', 'system')),

  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  resource_name TEXT,

  details JSONB DEFAULT '{}',
  ip_address TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_org ON layout_audit_log (org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_created ON layout_audit_log (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON layout_audit_log (org_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON layout_audit_log (org_id, resource_type, resource_id);

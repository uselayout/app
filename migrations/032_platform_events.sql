-- Migration 032: Cross-product event log for admin dashboard
-- Tracks non-AI actions: exports, downloads, plugin usage, component saves

CREATE TABLE IF NOT EXISTS layout_platform_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  org_id UUID,
  event TEXT NOT NULL,
  product TEXT NOT NULL DEFAULT 'studio',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_event_created ON layout_platform_event (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_event_type ON layout_platform_event (event, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_event_product ON layout_platform_event (product, created_at DESC);

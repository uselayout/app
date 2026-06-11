-- Migration 031: API request/error log for admin dashboard
-- Tracks latency, errors, and endpoint-specific metadata across all key routes

CREATE TABLE IF NOT EXISTS layout_api_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  status_code INTEGER NOT NULL,
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_log_created ON layout_api_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_log_endpoint ON layout_api_log (endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_log_errors ON layout_api_log (created_at DESC) WHERE status_code >= 400;

-- Audit log for cross-environment kit promotions (staging → production).
-- Each row records one promote attempt: which kit, where it went, what files
-- were copied, success/failure. Useful for "did this kit get pushed to prod?
-- what storage did it bring?" forensics, especially when a promote fails
-- mid-way and we need to know which files actually landed.
--
-- Always written on the SOURCE environment (staging) since that's where the
-- promote action originates.

CREATE TABLE IF NOT EXISTS layout_kit_promote_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id       UUID NOT NULL,
  kit_slug     TEXT NOT NULL,
  target_env   TEXT NOT NULL CHECK (target_env IN ('production', 'staging')),
  target_url   TEXT NOT NULL,
  overwrite    BOOLEAN NOT NULL DEFAULT false,
  files_copied JSONB NOT NULL DEFAULT '[]'::jsonb,
  success      BOOLEAN NOT NULL,
  error        TEXT,
  duration_ms  INTEGER,
  promoted_by  TEXT,
  promoted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kit_promote_log_kit_id
  ON layout_kit_promote_log (kit_id, promoted_at DESC);

CREATE INDEX IF NOT EXISTS idx_kit_promote_log_kit_slug
  ON layout_kit_promote_log (kit_slug, promoted_at DESC);

INSERT INTO layout_migrations (name)
VALUES ('056_kit_promote_log.sql')
ON CONFLICT (name) DO NOTHING;

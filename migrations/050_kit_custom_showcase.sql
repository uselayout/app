-- 050_kit_custom_showcase.sql
--
-- Adds two columns to layout_public_kit so every kit can carry a bespoke
-- AI-generated showcase that overrides the uniform template:
--   * showcase_custom_tsx: the raw TSX Claude produced (kept for audit + future regen)
--   * showcase_custom_js:  pre-transpiled JS for instant iframe render
--
-- When both are null the detail page falls back to the uniform template in
-- components/gallery/kit-showcase-source.ts, so legacy kits keep rendering.

ALTER TABLE layout_public_kit
  ADD COLUMN IF NOT EXISTS showcase_custom_tsx TEXT,
  ADD COLUMN IF NOT EXISTS showcase_custom_js  TEXT,
  ADD COLUMN IF NOT EXISTS showcase_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preview_generated_at  TIMESTAMPTZ;

INSERT INTO layout_migrations (name)
VALUES ('050_kit_custom_showcase.sql')
ON CONFLICT (name) DO NOTHING;

-- 046_branding_context_columns.sql
--
-- Adds branding_assets and context_documents to layout_projects. Both
-- power Design System hub features (Branding tab, Product Context tab)
-- that exist in the deployed app code already but whose columns were
-- added manually on staging and never on production. This migration
-- captures them in version control and brings production up to parity.
--
-- Idempotent: safe to re-run. No-op on environments that already have
-- the columns (staging).

ALTER TABLE layout_projects
  ADD COLUMN IF NOT EXISTS branding_assets jsonb,
  ADD COLUMN IF NOT EXISTS context_documents jsonb;

INSERT INTO layout_migrations (name)
VALUES ('046_branding_context_columns.sql')
ON CONFLICT (name) DO NOTHING;

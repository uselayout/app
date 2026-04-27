-- 054_kit_bespoke_showcase_flag.sql
--
-- Flips the Live Preview model from "always Claude-generated" to
-- "uniform template by default, Claude when the publisher opts in".
--
-- Existing kits that already have a Claude-generated showcase
-- (`showcase_custom_tsx IS NOT NULL`) get backfilled to bespoke=true so
-- their current presentation is preserved. New rows default to false and
-- render through the hand-built uniform template.

ALTER TABLE layout_public_kit
  ADD COLUMN IF NOT EXISTS bespoke_showcase BOOLEAN NOT NULL DEFAULT false;

UPDATE layout_public_kit
SET bespoke_showcase = true
WHERE showcase_custom_tsx IS NOT NULL
  AND bespoke_showcase = false;

INSERT INTO layout_migrations (name)
VALUES ('054_kit_bespoke_showcase_flag.sql')
ON CONFLICT (name) DO NOTHING;

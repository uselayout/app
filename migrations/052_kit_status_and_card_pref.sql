-- 052_kit_status_and_card_pref.sql
--
-- Adds an admin review queue to the gallery and a per-kit override for which
-- image (auto/hero/preview) shows on the public card.
--
-- Self-published kits land in `pending` and are excluded from public listings
-- until an admin approves them. Layout-team publishes still go straight to
-- `approved`. Existing rows are backfilled to `approved` so nothing live
-- falls into the queue.
--
-- card_image_pref overrides the fallback chain on KitCard so admin can swap
-- between the GPT Image 2 hero and the Playwright preview without
-- regenerating either.

ALTER TABLE layout_public_kit
  ADD COLUMN IF NOT EXISTS status                 TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved')),
  ADD COLUMN IF NOT EXISTS card_image_pref        TEXT NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS custom_card_image_url  TEXT;

-- Update the check constraint to allow 'custom' (and re-create idempotently
-- so this migration is safe to re-run if a prior version dropped a stricter
-- constraint).
ALTER TABLE layout_public_kit DROP CONSTRAINT IF EXISTS layout_public_kit_card_image_pref_check;
ALTER TABLE layout_public_kit
  ADD CONSTRAINT layout_public_kit_card_image_pref_check
  CHECK (card_image_pref IN ('auto', 'custom', 'hero', 'preview'));

-- Backfill rows that existed before this migration to approved so they stay
-- visible. New rows fall through to the column default ('pending').
UPDATE layout_public_kit
SET status = 'approved'
WHERE status = 'pending'
  AND created_at < NOW();

CREATE INDEX IF NOT EXISTS idx_layout_public_kit_status
  ON layout_public_kit (status)
  WHERE status = 'approved';

INSERT INTO layout_migrations (name)
VALUES ('052_kit_status_and_card_pref.sql')
ON CONFLICT (name) DO NOTHING;

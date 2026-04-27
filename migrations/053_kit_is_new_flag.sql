-- 053_kit_is_new_flag.sql
--
-- Admin-curated "New" badge for the Kit Gallery. Mirrors the existing
-- featured / hidden / unlisted pattern: admin toggles it, public KitCards
-- render the badge when true. Manual control means we can promote
-- newsworthy kits as long or short as we like, independent of created_at.

ALTER TABLE layout_public_kit
  ADD COLUMN IF NOT EXISTS is_new BOOLEAN NOT NULL DEFAULT false;

INSERT INTO layout_migrations (name)
VALUES ('053_kit_is_new_flag.sql')
ON CONFLICT (name) DO NOTHING;

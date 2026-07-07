-- 059: per-kit registry publishing + marketing flags
--
-- registry_enabled:   admin opt-in. Serve this kit as a shadcn-compatible
--                     registry item at /api/public/kits/<slug>/registry so
--                     `npx shadcn add <url>` installs the full kit
--                     (.layout/ files + token cssVars).
-- marketing_featured: admin flag. Kit is a marketing piece, surfaced on
--                     marketing pages (e.g. the Layout UI section).
--
-- Apply to staging:
--   cat migrations/059_kit_registry_flags.sql | \
--     ssh root@94.130.130.22 "docker exec -i supabase-db-<service> psql -U postgres"

ALTER TABLE layout_public_kit
  ADD COLUMN IF NOT EXISTS registry_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE layout_public_kit
  ADD COLUMN IF NOT EXISTS marketing_featured boolean NOT NULL DEFAULT false;

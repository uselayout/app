-- Optional brand homepage URL for the kit detail page.
-- Surfaced as a "Visit pinterest.com" pill in the heading row when set.
-- Edited inline by Layout admins via PATCH /api/admin/kits/[id].

ALTER TABLE layout_public_kit
  ADD COLUMN IF NOT EXISTS homepage_url text NULL;

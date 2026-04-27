-- 052_kit_style_profile.sql
--
-- Adds a `style_profile` JSONB column to layout_public_kit. Stores a small
-- structured object Claude derives from the kit's layout.md + tokens.css —
-- per-kit hints for the uniform Live Preview's button radius, fill style,
-- input focus treatment, card elevation, badge shape, etc.
--
-- The schema lives in lib/types/kit-style-profile.ts (KitStyleProfile).
-- Renderer falls back to DEFAULT_STYLE_PROFILE when the column is null.
--
-- Cheap to derive (Claude returns small JSON, no JSX), predictable to
-- render (no transpile risk), and easy to evolve (improve the renderer
-- once, every kit benefits).

ALTER TABLE layout_public_kit
  ADD COLUMN IF NOT EXISTS style_profile JSONB,
  ADD COLUMN IF NOT EXISTS style_profile_generated_at TIMESTAMPTZ;

INSERT INTO layout_migrations (name)
VALUES ('052_kit_style_profile.sql')
ON CONFLICT (name) DO NOTHING;

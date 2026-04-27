-- 048_layout_public_kit.sql
--
-- Kit Gallery: community-shared design-system kits published from Studio
-- projects. Kits are publicly browsable at /gallery and one-click importable
-- into any org. Companion repo uselayout/awesome-layout-md mirrors the
-- minimal-tier kits nightly.
--
-- A kit is immutable once published. New versions create a new row with
-- parent_kit_id pointing at the previous one. This prevents silently
-- breaking anyone who has already imported the kit.

CREATE TABLE IF NOT EXISTS layout_public_kit (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 text NOT NULL UNIQUE,

  name                 text NOT NULL,
  description          text,
  tags                 text[] NOT NULL DEFAULT '{}',

  author_org_id        text NOT NULL,
  author_user_id       text,
  author_display_name  text,
  author_avatar_url    text,

  licence              text NOT NULL DEFAULT 'MIT',
  licence_custom       text,

  preview_image_url    text,

  layout_md            text NOT NULL DEFAULT '',
  tokens_css           text NOT NULL DEFAULT '',
  tokens_json          jsonb NOT NULL DEFAULT '{}'::jsonb,
  kit_json             jsonb NOT NULL DEFAULT '{}'::jsonb,

  tier                 text NOT NULL DEFAULT 'minimal' CHECK (tier IN ('minimal', 'rich')),
  rich_bundle          jsonb,

  source_project_id    uuid,
  parent_kit_id        uuid REFERENCES layout_public_kit(id) ON DELETE SET NULL,

  featured             boolean NOT NULL DEFAULT false,
  hidden               boolean NOT NULL DEFAULT false,
  unlisted             boolean NOT NULL DEFAULT false,

  upvote_count         integer NOT NULL DEFAULT 0,
  import_count         integer NOT NULL DEFAULT 0,
  view_count           integer NOT NULL DEFAULT 0,

  github_folder        text,
  github_synced_at     timestamptz,

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS layout_public_kit_public_idx
  ON layout_public_kit (hidden, unlisted, featured DESC, upvote_count DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS layout_public_kit_author_idx
  ON layout_public_kit (author_org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS layout_public_kit_tags_idx
  ON layout_public_kit USING gin (tags);

-- Upvotes. One row per (user, kit). Toggle by insert/delete.
CREATE TABLE IF NOT EXISTS layout_public_kit_upvote (
  kit_id     uuid NOT NULL REFERENCES layout_public_kit(id) ON DELETE CASCADE,
  user_id    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kit_id, user_id)
);

CREATE INDEX IF NOT EXISTS layout_public_kit_upvote_user_idx
  ON layout_public_kit_upvote (user_id);

-- Keep upvote_count in sync with the upvote rows. Cheaper than COUNT(*) on read.
CREATE OR REPLACE FUNCTION layout_public_kit_upvote_sync() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE layout_public_kit
      SET upvote_count = upvote_count + 1
      WHERE id = NEW.kit_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE layout_public_kit
      SET upvote_count = GREATEST(0, upvote_count - 1)
      WHERE id = OLD.kit_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS layout_public_kit_upvote_sync_tr ON layout_public_kit_upvote;
CREATE TRIGGER layout_public_kit_upvote_sync_tr
  AFTER INSERT OR DELETE ON layout_public_kit_upvote
  FOR EACH ROW EXECUTE FUNCTION layout_public_kit_upvote_sync();

-- RLS is off: reads go through app server with service-role key, which enforces
-- the hidden / unlisted filters at the query level. Matches the pattern used by
-- layout_projects and layout_changelog_draft.
ALTER TABLE layout_public_kit DISABLE ROW LEVEL SECURITY;
ALTER TABLE layout_public_kit_upvote DISABLE ROW LEVEL SECURITY;

INSERT INTO layout_migrations (name)
VALUES ('048_layout_public_kit.sql')
ON CONFLICT (name) DO NOTHING;

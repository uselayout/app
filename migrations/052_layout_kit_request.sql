-- 052_layout_kit_request.sql
--
-- Kit Wishlist: signed-in users nominate kits they would like to see in the
-- gallery, others upvote, and admins can remove or mark fulfilled when the
-- corresponding kit ships. Mirrors the layout_public_kit_upvote shape from
-- migration 048.

CREATE TABLE IF NOT EXISTS layout_kit_request (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Normalised hostname (lowercase, no protocol, no leading www., no trailing
  -- slash). The dedupe key.
  hostname           text NOT NULL UNIQUE,

  -- Original URL the user pasted, kept verbatim for display + admin context.
  url                text NOT NULL,

  -- Display name. Server fetches the page <title>; falls back to hostname.
  name               text NOT NULL,
  description        text,

  submitted_by       text NOT NULL,

  status             text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'fulfilled', 'rejected')),

  -- When fulfilled, points at the public kit that satisfied this request.
  fulfilled_kit_id   uuid REFERENCES layout_public_kit(id) ON DELETE SET NULL,

  upvote_count       integer NOT NULL DEFAULT 0,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS layout_kit_request_public_idx
  ON layout_kit_request (status, upvote_count DESC, created_at DESC);

-- Upvotes. One row per (user, request). Toggle by insert/delete.
CREATE TABLE IF NOT EXISTS layout_kit_request_upvote (
  request_id uuid NOT NULL REFERENCES layout_kit_request(id) ON DELETE CASCADE,
  user_id    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, user_id)
);

CREATE INDEX IF NOT EXISTS layout_kit_request_upvote_user_idx
  ON layout_kit_request_upvote (user_id);

-- Keep upvote_count in sync with the upvote rows. Same shape as
-- layout_public_kit_upvote_sync from migration 048.
CREATE OR REPLACE FUNCTION layout_kit_request_upvote_sync() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE layout_kit_request
      SET upvote_count = upvote_count + 1
      WHERE id = NEW.request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE layout_kit_request
      SET upvote_count = GREATEST(0, upvote_count - 1)
      WHERE id = OLD.request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS layout_kit_request_upvote_sync_tr ON layout_kit_request_upvote;
CREATE TRIGGER layout_kit_request_upvote_sync_tr
  AFTER INSERT OR DELETE ON layout_kit_request_upvote
  FOR EACH ROW EXECUTE FUNCTION layout_kit_request_upvote_sync();

-- RLS off; service-role reads enforce the status filter at the query level,
-- matching the convention used by layout_public_kit.
ALTER TABLE layout_kit_request DISABLE ROW LEVEL SECURITY;
ALTER TABLE layout_kit_request_upvote DISABLE ROW LEVEL SECURITY;

INSERT INTO layout_migrations (name)
VALUES ('052_layout_kit_request.sql')
ON CONFLICT (name) DO NOTHING;

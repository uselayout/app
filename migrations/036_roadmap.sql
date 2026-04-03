-- Public product roadmap with voting
CREATE TABLE layout_roadmap_item (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  product     TEXT NOT NULL DEFAULT 'studio',
  status      TEXT NOT NULL DEFAULT 'planned',
  sort_order  INT DEFAULT 0,
  vote_count  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE layout_roadmap_vote (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    UUID NOT NULL REFERENCES layout_roadmap_item(id) ON DELETE CASCADE,
  voter_id   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(item_id, voter_id)
);

CREATE INDEX roadmap_item_status_idx ON layout_roadmap_item (status, sort_order);
CREATE INDEX roadmap_vote_item_idx ON layout_roadmap_vote (item_id);

-- Trigger to keep vote_count in sync
CREATE OR REPLACE FUNCTION update_roadmap_vote_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE layout_roadmap_item SET vote_count = vote_count + 1 WHERE id = NEW.item_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE layout_roadmap_item SET vote_count = vote_count - 1 WHERE id = OLD.item_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER roadmap_vote_count_trigger
  AFTER INSERT OR DELETE ON layout_roadmap_vote
  FOR EACH ROW EXECUTE FUNCTION update_roadmap_vote_count();

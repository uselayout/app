-- Token sync: track last sync timestamp and local modification flag
ALTER TABLE layout_token
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS modified_locally BOOLEAN DEFAULT false;

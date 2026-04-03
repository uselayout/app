-- Move changelog draft entries from file-based to database
CREATE TABLE layout_changelog_draft (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  product     TEXT NOT NULL,
  category    TEXT NOT NULL,
  date        TEXT NOT NULL,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

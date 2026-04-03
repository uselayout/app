-- Published changelog weeks in Supabase (replaces content/changelog/published.ts)
CREATE TABLE layout_changelog_published (
  week_id   TEXT PRIMARY KEY,
  label     TEXT NOT NULL,
  summary   TEXT NOT NULL,
  items     JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns for codebase scanner results (CLI scan --sync and GitHub connection)
ALTER TABLE layout_projects
  ADD COLUMN IF NOT EXISTS scanned_components jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS scan_source text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_scan_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS github_repo text DEFAULT NULL;

-- Index for GitHub webhook project lookup
CREATE INDEX IF NOT EXISTS idx_projects_github_repo
  ON layout_projects (github_repo)
  WHERE github_repo IS NOT NULL;

-- Comments
COMMENT ON COLUMN layout_projects.scanned_components IS 'JSON array of ScannedComponent objects from CLI scan or GitHub scan';
COMMENT ON COLUMN layout_projects.scan_source IS 'Source of last scan: cli or github';
COMMENT ON COLUMN layout_projects.last_scan_at IS 'Timestamp of last component scan';
COMMENT ON COLUMN layout_projects.github_repo IS 'GitHub repo full name (owner/repo) for webhook matching';

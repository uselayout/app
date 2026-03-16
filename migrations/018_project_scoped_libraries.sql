-- Migration 018: Project-scoped libraries
-- Add project_id to components, fix unique constraints for project isolation
-- Note: layout_projects.id is TEXT, not UUID

-- 1. Fix token project_id type if it was created as UUID
-- (migration 010 declared UUID but layout_projects.id is TEXT)
ALTER TABLE layout_token DROP CONSTRAINT IF EXISTS layout_token_project_id_fkey;
ALTER TABLE layout_token ALTER COLUMN project_id TYPE TEXT;
ALTER TABLE layout_token ADD CONSTRAINT layout_token_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES layout_projects(id) ON DELETE SET NULL;

-- 2. Add project_id to layout_component (as TEXT to match layout_projects.id)
ALTER TABLE layout_component
  ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES layout_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_component_project ON layout_component (org_id, project_id);

-- 3. Change token unique constraint from (org_id, slug) to (org_id, project_id, slug)
ALTER TABLE layout_token DROP CONSTRAINT IF EXISTS layout_token_org_id_slug_key;
ALTER TABLE layout_token ADD CONSTRAINT layout_token_org_project_slug_key UNIQUE(org_id, project_id, slug);

-- 4. Change component unique constraint similarly
ALTER TABLE layout_component DROP CONSTRAINT IF EXISTS layout_component_org_id_slug_key;
ALTER TABLE layout_component ADD CONSTRAINT layout_component_org_project_slug_key UNIQUE(org_id, project_id, slug);

-- 5. Add project index for tokens
CREATE INDEX IF NOT EXISTS idx_token_project ON layout_token (org_id, project_id);

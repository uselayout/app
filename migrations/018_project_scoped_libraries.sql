-- Migration 018: Project-scoped libraries
-- Add project_id to components, fix unique constraints for project isolation

-- 1. Add project_id to layout_component
ALTER TABLE layout_component
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES layout_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_component_project ON layout_component (org_id, project_id);

-- 2. Change token unique constraint from (org_id, slug) to (org_id, project_id, slug)
ALTER TABLE layout_token DROP CONSTRAINT IF EXISTS layout_token_org_id_slug_key;
ALTER TABLE layout_token ADD CONSTRAINT layout_token_org_project_slug_key UNIQUE(org_id, project_id, slug);

-- 3. Change component unique constraint similarly
ALTER TABLE layout_component DROP CONSTRAINT IF EXISTS layout_component_org_id_slug_key;
ALTER TABLE layout_component ADD CONSTRAINT layout_component_org_project_slug_key UNIQUE(org_id, project_id, slug);

-- 4. Add project index for tokens (already has idx_token_org)
CREATE INDEX IF NOT EXISTS idx_token_project ON layout_token (org_id, project_id);

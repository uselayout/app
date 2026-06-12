-- Add explorations column to layout_projects for Design Explorer persistence
ALTER TABLE layout_projects ADD COLUMN IF NOT EXISTS explorations jsonb DEFAULT NULL;

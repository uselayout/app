-- Add pending_canvas_image column for push-to-canvas screenshots
-- These are temporary images pushed from the Chrome extension for Canvas variant generation
-- They are NOT extraction screenshots (which live in extraction_data.screenshots)
ALTER TABLE layout_projects ADD COLUMN IF NOT EXISTS pending_canvas_image TEXT;

-- Migration: add edit_schema + linked_component_name to layout_component
-- edit_schema      — JSON manifest the AI emits alongside generated TSX so
--                    the inspector drawer can render token-driven form
--                    controls without parsing the TSX itself.
-- linked_component_name — when a saved component was generated FROM an
--                    imported Figma component, this stores that imported
--                    component's name (e.g. "Button"). Used to surface the
--                    saved component as the canonical example in
--                    layout.md Section 5.
-- Both nullable + idempotent.

ALTER TABLE layout_component
  ADD COLUMN IF NOT EXISTS edit_schema JSONB,
  ADD COLUMN IF NOT EXISTS linked_component_name TEXT;

CREATE INDEX IF NOT EXISTS layout_component_linked_component_name_idx
  ON layout_component (org_id, project_id, linked_component_name)
  WHERE linked_component_name IS NOT NULL;

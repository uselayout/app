-- Migration 025: Add design_type column to layout_component
-- Supports component vs page classification in the library

ALTER TABLE layout_component
  ADD COLUMN IF NOT EXISTS design_type TEXT NOT NULL DEFAULT 'component';

ALTER TABLE layout_component
  ADD CONSTRAINT layout_component_design_type_check
  CHECK (design_type IN ('component', 'page'));

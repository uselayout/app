-- Migration 024: Rename design_md to layout_md
-- Part of the DESIGN.md → layout.md rebrand across the platform

ALTER TABLE layout_design_md_versions RENAME TO layout_md_versions;
ALTER TABLE layout_md_versions RENAME COLUMN design_md TO layout_md;

ALTER TABLE layout_projects RENAME COLUMN design_md TO layout_md;

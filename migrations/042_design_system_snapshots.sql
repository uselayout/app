-- Persist design system snapshots so the SnapshotManager UI is not a lie.
-- Previously snapshots were mutated client-side but stripBloatForSave deleted
-- them before upload, so they vanished on reload (Phase 0 bug B6).

ALTER TABLE layout_projects
  ADD COLUMN IF NOT EXISTS snapshots jsonb DEFAULT NULL;

COMMENT ON COLUMN layout_projects.snapshots IS
  'JSON array of DesignSystemSnapshot objects (max 5, capped client-side). Each snapshot captures tokens, layoutMd, standardisation at the time it was taken. Used by the Design System page snapshot manager for rollback.';

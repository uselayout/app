-- Create the branding bucket for project brand assets (logos, marks, wordmarks).
-- Served publicly (proxied through /api/storage/branding/<orgId>/<projectId>/...)
-- so brand logos render in kit showcases, gallery hero generation, and Studio
-- inspector. Public-read mirrors the user-avatars / layout-fonts pattern.
--
-- Was created ad-hoc on staging months ago but the corresponding migration
-- never made it into git — discovered when staging→prod kit port left every
-- gallery kit's branding assets 404'ing on layout.design.

INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read branding"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'branding');

CREATE POLICY "Authenticated users can upload branding"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'branding');

CREATE POLICY "Authenticated users can delete branding"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'branding');

INSERT INTO layout_migrations (name)
VALUES ('055_branding_bucket.sql')
ON CONFLICT (name) DO NOTHING;

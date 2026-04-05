-- Create the layout-fonts bucket for custom font file uploads.
-- Fonts uploaded here are served in variant preview iframes via @font-face
-- and included in export bundles (.layout/fonts/).

INSERT INTO storage.buckets (id, name, public)
VALUES ('layout-fonts', 'layout-fonts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read fonts (used in public iframes and export bundles)
CREATE POLICY "Anyone can read layout-fonts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'layout-fonts');

-- Allow authenticated users to upload fonts
CREATE POLICY "Authenticated users can upload layout-fonts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'layout-fonts');

-- Allow authenticated users to delete their uploaded fonts
CREATE POLICY "Authenticated users can delete layout-fonts"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'layout-fonts');

-- Create the layout-images bucket for AI-generated images.
-- Without this bucket, generateImage() falls back to inline base64 data URLs
-- which makes variant code 300-400KB per image, breaking transpilation.

INSERT INTO storage.buckets (id, name, public)
VALUES ('layout-images', 'layout-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read images (they're used in public iframes)
CREATE POLICY "Anyone can read layout-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'layout-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload layout-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'layout-images');

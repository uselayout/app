-- Ensure the screenshots bucket exists for Figma/website extraction screenshots.
-- Stores full-page.png and viewport.png taken during extraction.

INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read screenshots (used in preview iframes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read screenshots'
  ) THEN
    CREATE POLICY "Anyone can read screenshots"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'screenshots');
  END IF;
END $$;

-- Allow authenticated users to upload screenshots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload screenshots'
  ) THEN
    CREATE POLICY "Authenticated users can upload screenshots"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'screenshots');
  END IF;
END $$;

-- Allow authenticated users to delete screenshots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete screenshots'
  ) THEN
    CREATE POLICY "Authenticated users can delete screenshots"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'screenshots');
  END IF;
END $$;

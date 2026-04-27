-- Create the user-avatars bucket for user profile pictures.
-- Served publicly (proxied through /api/storage/user-avatars/...) so avatars
-- render on gallery cards, Studio top bar, and anywhere a user.image URL
-- is referenced.

INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read user-avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

CREATE POLICY "Authenticated users can upload user-avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-avatars');

CREATE POLICY "Authenticated users can delete user-avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'user-avatars');

INSERT INTO layout_migrations (name)
VALUES ('049_user_avatars_bucket.sql')
ON CONFLICT (name) DO NOTHING;

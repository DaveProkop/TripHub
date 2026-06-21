-- Storage bucket for trip and visit photos (public read, auth-guarded write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trip-photos',
  'trip-photos',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read (bucket is public, but policy is explicit for clarity)
CREATE POLICY "trip_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'trip-photos');

-- Authenticated users can upload under their own user_id prefix
CREATE POLICY "trip_photos_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'trip-photos'
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can only delete their own files
CREATE POLICY "trip_photos_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'trip-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Trip visits: any auth user can mark a trip as visited and add their own photos
CREATE TABLE IF NOT EXISTS public.trip_visits (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id     UUID        REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  photos      TEXT[]      DEFAULT '{}',
  visited_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);
ALTER TABLE public.trip_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visits_select_auth" ON public.trip_visits
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "visits_insert_own" ON public.trip_visits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "visits_update_own" ON public.trip_visits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "visits_delete_own" ON public.trip_visits
  FOR DELETE USING (auth.uid() = user_id);

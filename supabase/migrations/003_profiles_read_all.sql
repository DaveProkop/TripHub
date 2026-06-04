-- Allow all authenticated users to read all profiles (needed for users overview)
CREATE POLICY "profiles_read_all" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

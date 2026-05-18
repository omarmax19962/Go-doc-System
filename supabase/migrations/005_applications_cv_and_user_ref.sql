-- CV URL and auth user reference for doctor applications
ALTER TABLE doctor_applications
  ADD COLUMN IF NOT EXISTS cv_url       text,
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Storage bucket for CV uploads (public so admins can view via URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-cvs', 'doctor-cvs', true)
ON CONFLICT DO NOTHING;

-- Anyone can upload (unauthenticated applicants)
CREATE POLICY "anyone can upload to doctor-cvs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'doctor-cvs');

-- Public read (admins click link to view)
CREATE POLICY "public can read doctor-cvs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'doctor-cvs');

-- Admins can delete
CREATE POLICY "admins can delete doctor-cvs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'doctor-cvs' AND get_user_role() = 'admin');

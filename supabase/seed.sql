-- Seed: default admin and doctor for local development
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  raw_user_meta_data, raw_app_meta_data, aud, role, created_at, updated_at)
VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin@godoc.eg',
    crypt('admin1234', gen_salt('bf')),
    now(), '', '', '', '', '', '', '', '',
    '{"role":"admin","full_name":"Admin User"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'doctor@godoc.eg',
    crypt('doctor1234', gen_salt('bf')),
    now(), '', '', '', '', '', '', '', '',
    '{"role":"doctor","full_name":"Dr. Test"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  )
ON CONFLICT (id) DO NOTHING;

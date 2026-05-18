-- Rewrite handle_new_user to be idempotent and resilient
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role user_role;
BEGIN
  -- Safely cast role from metadata, default to 'doctor' on any failure
  BEGIN
    v_role := (NEW.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'doctor';
  END;

  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(v_role, 'doctor'),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), NEW.email),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '')
  )
  ON CONFLICT (id) DO UPDATE
    SET
      role      = EXCLUDED.role,
      full_name = EXCLUDED.full_name,
      phone     = COALESCE(EXCLUDED.phone, profiles.phone);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

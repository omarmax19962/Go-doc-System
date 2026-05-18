-- Allow programs to be created without an assigned doctor
ALTER TABLE programs
  ALTER COLUMN doctor_id DROP NOT NULL;

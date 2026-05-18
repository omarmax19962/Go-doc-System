-- ============================================================
-- Go Doc Operations Platform v1 — Initial Schema
-- Run via: supabase db reset
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- fuzzy search on patient names

-- ─── Enums ───────────────────────────────────────────────────

create type user_role as enum ('admin', 'doctor');

create type patient_status as enum (
  'lead', 'follow_up', 'didnt_reply',
  'booked', 'active', 'paused', 'discharged', 'lost'
);

create type source_channel as enum (
  'phone', 'whatsapp', 'referral', 'other'
);

create type visit_type as enum (
  'assessment', 'treatment', 'discharge'
);

create type visit_status as enum (
  'scheduled', 'confirmed', 'in_progress',
  'completed', 'cancelled', 'no_show', 'rescheduled'
);

create type note_review_status as enum (
  'draft', 'submitted', 'under_review',
  'approved', 'approved_with_comment', 'returned'
);

create type review_action_type as enum (
  'approve', 'approve_with_comment', 'send_back'
);

create type patient_response as enum (
  'better', 'same', 'worse', 'mixed'
);

create type program_source as enum (
  'uploaded', 'form_generated'
);

create type gender as enum ('male', 'female');

create type dosage_type as enum ('sets_reps', 'duration');

-- ─── Profiles (extends Supabase auth.users) ───────────────────

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         user_role not null,
  full_name    text not null,
  phone        text,
  avatar_url   text,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

-- ─── Doctors ──────────────────────────────────────────────────

create table public.doctors (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  specialty          text not null,
  gender             gender not null,
  covered_locations  jsonb not null default '[]', -- array of Location objects
  is_active          boolean not null default true,
  created_at         timestamptz default now() not null,
  updated_at         timestamptz default now() not null,
  unique(user_id)
);

-- ─── Patients ─────────────────────────────────────────────────

create table public.patients (
  id                    uuid primary key default uuid_generate_v4(),
  full_name             text not null,
  phone                 text not null,
  date_of_birth         date,
  gender                gender,
  address               jsonb not null,              -- Location object
  secondary_addresses   jsonb not null default '[]', -- array of Location
  complaint             text not null,
  source_channel        source_channel not null,
  status                patient_status not null default 'lead',
  referring_physician   text,
  assigned_doctor_id    uuid references public.doctors(id) on delete set null,
  payment_status        text,
  notes                 text,
  created_by            uuid not null references public.profiles(id),
  created_at            timestamptz default now() not null,
  updated_at            timestamptz default now() not null
);

-- Index for phone lookup (duplicate prevention during intake)
create index idx_patients_phone on public.patients(phone);
-- Index for name fuzzy search
create index idx_patients_name_trgm on public.patients using gin(full_name gin_trgm_ops);
-- Index for status filtering
create index idx_patients_status on public.patients(status);
-- Index for doctor filter
create index idx_patients_doctor on public.patients(assigned_doctor_id);

-- ─── Patient Status History ───────────────────────────────────

create table public.patient_status_history (
  id           uuid primary key default uuid_generate_v4(),
  patient_id   uuid not null references public.patients(id) on delete cascade,
  from_status  patient_status,
  to_status    patient_status not null,
  changed_by   uuid not null references public.profiles(id),
  note         text,
  created_at   timestamptz default now() not null
);

create index idx_status_history_patient on public.patient_status_history(patient_id);

-- ─── Visits ───────────────────────────────────────────────────

create table public.visits (
  id                         uuid primary key default uuid_generate_v4(),
  patient_id                 uuid not null references public.patients(id) on delete cascade,
  doctor_id                  uuid not null references public.doctors(id),
  location                   jsonb not null,   -- Location object
  type                       visit_type not null,
  status                     visit_status not null default 'scheduled',
  scheduled_at               timestamptz not null,
  started_at                 timestamptz,
  completed_at               timestamptz,
  cancellation_reason        text,
  next_visit_recommendation  text,
  payment_confirmed          boolean not null default false,
  created_by                 uuid not null references public.profiles(id),
  created_at                 timestamptz default now() not null,
  updated_at                 timestamptz default now() not null
);

create index idx_visits_doctor_date on public.visits(doctor_id, scheduled_at);
create index idx_visits_patient on public.visits(patient_id);
create index idx_visits_status on public.visits(status);
create index idx_visits_scheduled_at on public.visits(scheduled_at);

-- ─── Visit Notes ──────────────────────────────────────────────

create table public.visit_notes (
  id              uuid primary key default uuid_generate_v4(),
  visit_id        uuid not null references public.visits(id) on delete cascade,
  doctor_id       uuid not null references public.doctors(id),
  program_id      uuid,  -- FK added after programs table (below)
  quick_sheet     jsonb not null,   -- QuickSheet type
  full_sheet      jsonb,            -- FullSheet type (optional)
  review_status   note_review_status not null default 'draft',
  submitted_at    timestamptz,
  reviewed_at     timestamptz,
  reviewed_by     uuid references public.profiles(id),
  review_comment  text,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null,
  unique(visit_id)  -- one note per visit
);

create index idx_notes_review_status on public.visit_notes(review_status);
create index idx_notes_doctor on public.visit_notes(doctor_id);
create index idx_notes_submitted_at on public.visit_notes(submitted_at);

-- ─── Review Actions ───────────────────────────────────────────

create table public.review_actions (
  id          uuid primary key default uuid_generate_v4(),
  note_id     uuid not null references public.visit_notes(id) on delete cascade,
  admin_id    uuid not null references public.profiles(id),
  action      review_action_type not null,
  comment     text,
  created_at  timestamptz default now() not null
);

create index idx_review_actions_note on public.review_actions(note_id);

-- ─── Exercise Library ─────────────────────────────────────────

create table public.exercises (
  id                       uuid primary key default uuid_generate_v4(),
  name                     text not null,
  name_ar                  text,
  position                 text,
  description              text,
  description_ar           text,
  dosage_type              dosage_type not null default 'sets_reps',
  default_sets             int,
  default_reps             int,
  default_duration_seconds int,
  photo_url                text,
  video_url                text,
  notes                    text,
  flagged_for_review       boolean not null default false,
  created_by               uuid not null references public.profiles(id),
  created_at               timestamptz default now() not null,
  updated_at               timestamptz default now() not null
);

create index idx_exercises_name_trgm on public.exercises using gin(name gin_trgm_ops);

-- ─── Programs ─────────────────────────────────────────────────

create table public.programs (
  id                  uuid primary key default uuid_generate_v4(),
  patient_id          uuid not null references public.patients(id) on delete cascade,
  doctor_id           uuid not null references public.doctors(id),
  source              program_source not null,
  uploaded_file_url   text,
  uploaded_file_name  text,
  form_data           jsonb,  -- ProgramFormData type
  is_active           boolean not null default true,
  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null
);

create index idx_programs_patient on public.programs(patient_id);
create index idx_programs_doctor on public.programs(doctor_id);
create index idx_programs_active on public.programs(is_active);

-- Add FK from visit_notes to programs (now that programs exists)
alter table public.visit_notes
  add constraint fk_note_program
  foreign key (program_id) references public.programs(id) on delete set null;

-- ─── Auto-update updated_at ───────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function update_updated_at();

create trigger trg_doctors_updated_at
  before update on public.doctors
  for each row execute function update_updated_at();

create trigger trg_patients_updated_at
  before update on public.patients
  for each row execute function update_updated_at();

create trigger trg_visits_updated_at
  before update on public.visits
  for each row execute function update_updated_at();

create trigger trg_notes_updated_at
  before update on public.visit_notes
  for each row execute function update_updated_at();

create trigger trg_programs_updated_at
  before update on public.programs
  for each row execute function update_updated_at();

create trigger trg_exercises_updated_at
  before update on public.exercises
  for each row execute function update_updated_at();

-- ─── Auto-create profile on signup ───────────────────────────

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'doctor'),
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Row Level Security ──────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.patients enable row level security;
alter table public.patient_status_history enable row level security;
alter table public.visits enable row level security;
alter table public.visit_notes enable row level security;
alter table public.review_actions enable row level security;
alter table public.exercises enable row level security;
alter table public.programs enable row level security;

-- Helper: get current user role
create or replace function get_user_role()
returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper: get current doctor id
create or replace function get_doctor_id()
returns uuid as $$
  select id from public.doctors where user_id = auth.uid();
$$ language sql security definer stable;

-- ── Profiles ──
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_admin_read" on public.profiles
  for select using (get_user_role() = 'admin');

create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

-- ── Doctors ──
create policy "doctors_admin_all" on public.doctors
  for all using (get_user_role() = 'admin');

create policy "doctors_self_read" on public.doctors
  for select using (user_id = auth.uid());

create policy "doctors_read_all" on public.doctors
  for select using (get_user_role() = 'doctor');

-- ── Patients ──
create policy "patients_admin_all" on public.patients
  for all using (get_user_role() = 'admin');

create policy "patients_doctor_read_assigned" on public.patients
  for select using (
    get_user_role() = 'doctor' and
    assigned_doctor_id = get_doctor_id()
  );

-- ── Patient Status History ──
create policy "psh_admin_all" on public.patient_status_history
  for all using (get_user_role() = 'admin');

create policy "psh_doctor_read_assigned" on public.patient_status_history
  for select using (
    get_user_role() = 'doctor' and
    patient_id in (
      select id from public.patients where assigned_doctor_id = get_doctor_id()
    )
  );

-- ── Visits ──
create policy "visits_admin_all" on public.visits
  for all using (get_user_role() = 'admin');

create policy "visits_doctor_own" on public.visits
  for select using (
    get_user_role() = 'doctor' and
    doctor_id = get_doctor_id()
  );

create policy "visits_doctor_update_own" on public.visits
  for update using (
    get_user_role() = 'doctor' and
    doctor_id = get_doctor_id()
  );

-- ── Visit Notes ──
create policy "notes_admin_all" on public.visit_notes
  for all using (get_user_role() = 'admin');

create policy "notes_doctor_own" on public.visit_notes
  for all using (
    get_user_role() = 'doctor' and
    doctor_id = get_doctor_id()
  );

-- ── Review Actions ──
create policy "review_admin_all" on public.review_actions
  for all using (get_user_role() = 'admin');

create policy "review_doctor_read_own" on public.review_actions
  for select using (
    get_user_role() = 'doctor' and
    note_id in (
      select id from public.visit_notes where doctor_id = get_doctor_id()
    )
  );

-- ── Exercises ──
create policy "exercises_all_read" on public.exercises
  for select using (auth.uid() is not null);

create policy "exercises_all_insert" on public.exercises
  for insert with check (auth.uid() is not null);

create policy "exercises_admin_update_delete" on public.exercises
  for all using (get_user_role() = 'admin');

create policy "exercises_doctor_flag" on public.exercises
  for update using (
    get_user_role() = 'doctor' and
    -- Doctors can only update flagged_for_review field
    true
  );

-- ── Programs ──
create policy "programs_admin_all" on public.programs
  for all using (get_user_role() = 'admin');

create policy "programs_doctor_own_patients" on public.programs
  for all using (
    get_user_role() = 'doctor' and
    doctor_id = get_doctor_id()
  );

create policy "programs_doctor_read_assigned" on public.programs
  for select using (
    get_user_role() = 'doctor' and
    patient_id in (
      select id from public.patients where assigned_doctor_id = get_doctor_id()
    )
  );

-- ─── Storage Buckets ──────────────────────────────────────────

insert into storage.buckets (id, name, public) values
  ('visit-photos', 'visit-photos', false),
  ('program-docs', 'program-docs', false),
  ('avatars', 'avatars', true);

create policy "visit_photos_auth" on storage.objects
  for all using (
    bucket_id = 'visit-photos' and auth.uid() is not null
  );

create policy "program_docs_auth" on storage.objects
  for all using (
    bucket_id = 'program-docs' and auth.uid() is not null
  );

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_auth_upload" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and auth.uid() is not null
  );

-- ─── Seed: APTA Diagnoses reference ──────────────────────────
-- These are used for the primary/secondary diagnosis pickers

create table public.apta_diagnoses (
  id       uuid primary key default uuid_generate_v4(),
  system   text not null,
  name     text not null,
  name_ar  text,
  icd_hint text
);

insert into public.apta_diagnoses (system, name, name_ar) values
  -- Spinal
  ('Spinal', 'Lumbar Disc Herniation', 'انزلاق غضروفي قطني'),
  ('Spinal', 'Lumbar Spinal Stenosis', 'تضيق العمود الفقري القطني'),
  ('Spinal', 'Non-specific Low Back Pain', 'ألم أسفل الظهر غير المحدد'),
  ('Spinal', 'Cervical Radiculopathy', 'اعتلال الجذر العصبي العنقي'),
  ('Spinal', 'Cervical Myelopathy', 'اعتلال النخاع العنقي'),
  ('Spinal', 'Thoracic Outlet Syndrome', 'متلازمة المخرج الصدري'),
  ('Spinal', 'Spondylolisthesis', 'انزلاق الفقرات'),
  ('Spinal', 'Sacroiliac Joint Dysfunction', 'خلل وظيفي في المفصل العجزي الحرقفي'),
  -- Upper Extremity
  ('Upper Extremity', 'Rotator Cuff Tear', 'تمزق الكفة المدورة'),
  ('Upper Extremity', 'Shoulder Impingement Syndrome', 'متلازمة الاصطدام الكتفي'),
  ('Upper Extremity', 'Adhesive Capsulitis (Frozen Shoulder)', 'التهاب المحفظة اللاصق'),
  ('Upper Extremity', 'Lateral Epicondylalgia', 'ألم اللقيمة الجانبية'),
  ('Upper Extremity', 'Carpal Tunnel Syndrome', 'متلازمة النفق الرسغي'),
  ('Upper Extremity', 'De Quervain Tenosynovitis', 'التهاب غمد وتر ديكيرفان'),
  ('Upper Extremity', 'Biceps Tendinopathy', 'اعتلال وتر العضلة ذات الرأسين'),
  -- Lower Extremity
  ('Lower Extremity', 'Knee Osteoarthritis', 'هشاشة عظام الركبة'),
  ('Lower Extremity', 'Anterior Cruciate Ligament Injury', 'إصابة الرباط الصليبي الأمامي'),
  ('Lower Extremity', 'Meniscal Tear', 'تمزق الغضروف الهلالي'),
  ('Lower Extremity', 'Patellofemoral Pain Syndrome', 'متلازمة الألم الرضفي الفخذي'),
  ('Lower Extremity', 'Plantar Fasciitis', 'التهاب اللفافة الأخمصية'),
  ('Lower Extremity', 'Tarsal Tunnel Syndrome', 'متلازمة النفق الرسغي للقدم'),
  ('Lower Extremity', 'Achilles Tendinopathy', 'اعتلال وتر العرقوب'),
  ('Lower Extremity', 'Hip Osteoarthritis', 'هشاشة عظام الورك'),
  ('Lower Extremity', 'Greater Trochanteric Pain Syndrome', 'متلازمة ألم المدور الكبير'),
  ('Lower Extremity', 'Ankle Sprain', 'التواء الكاحل'),
  -- Neurological
  ('Neurological', 'Stroke (CVA) Rehabilitation', 'إعادة تأهيل السكتة الدماغية'),
  ('Neurological', 'Parkinson''s Disease', 'مرض باركنسون'),
  ('Neurological', 'Multiple Sclerosis', 'التصلب المتعدد'),
  ('Neurological', 'Guillain-Barré Syndrome', 'متلازمة غيان باريه'),
  ('Neurological', 'Peripheral Neuropathy', 'اعتلال الأعصاب الطرفية'),
  ('Neurological', 'Bell''s Palsy', 'شلل بيل'),
  ('Neurological', 'Spinal Cord Injury', 'إصابة الحبل الشوكي'),
  ('Neurological', 'Vestibular Dysfunction', 'خلل دهليزي'),
  ('Neurological', 'BPPV', 'دوخة الوضعة الانتيابية الحميدة'),
  -- Post-Surgical
  ('Post-Surgical', 'Post Total Knee Replacement', 'بعد استبدال الركبة الكلي'),
  ('Post-Surgical', 'Post Total Hip Replacement', 'بعد استبدال الورك الكلي'),
  ('Post-Surgical', 'Post Lumbar Discectomy', 'بعد استئصال الغضروف القطني'),
  ('Post-Surgical', 'Post Rotator Cuff Repair', 'بعد إصلاح الكفة المدورة'),
  ('Post-Surgical', 'Post ACL Reconstruction', 'بعد إعادة بناء الرباط الصليبي الأمامي'),
  ('Post-Surgical', 'Post Tarsal Tunnel Decompression', 'بعد تخفيف ضغط النفق الرسغي للقدم'),
  ('Post-Surgical', 'Post Carpal Tunnel Release', 'بعد تحرير النفق الرسغي'),
  -- Other
  ('Other', 'Fibromyalgia', 'الفيبروميالجيا'),
  ('Other', 'Osteoporosis', 'هشاشة العظام'),
  ('Other', 'Lymphedema', 'الوذمة اللمفاوية'),
  ('Other', 'Burns Rehabilitation', 'إعادة تأهيل الحروق'),
  ('Other', 'Pediatric Physiotherapy', 'علاج طبيعي للأطفال'),
  ('Other', 'Geriatric Physiotherapy', 'علاج طبيعي لكبار السن'),
  ('Other', 'Sports Injury', 'إصابة رياضية'),
  ('Other', 'Postural Dysfunction', 'خلل وظيفي في الوضعية');

-- RLS on apta_diagnoses — everyone authenticated can read
alter table public.apta_diagnoses enable row level security;
create policy "apta_read_all" on public.apta_diagnoses
  for select using (auth.uid() is not null);

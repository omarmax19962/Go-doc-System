-- ============================================================
-- Migration 002: Doctor Applications
-- Doctors can self-apply; admin reviews and accepts/rejects
-- ============================================================

create type application_status as enum ('pending', 'accepted', 'rejected');

create table public.doctor_applications (
  id               uuid primary key default uuid_generate_v4(),
  full_name        text not null,
  email            text not null,
  phone            text,
  specialty        text not null,
  gender           gender not null,
  bio              text,
  status           application_status not null default 'pending',
  rejection_reason text,
  reviewed_by      uuid references public.profiles(id),
  reviewed_at      timestamptz,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

create index idx_applications_status on public.doctor_applications(status);
create index idx_applications_created on public.doctor_applications(created_at desc);

alter table public.doctor_applications enable row level security;

-- Anyone (including unauthenticated) can submit an application
create policy "applications_public_insert" on public.doctor_applications
  for insert with check (true);

-- Only admins can read and update applications
create policy "applications_admin_all" on public.doctor_applications
  for all using (get_user_role() = 'admin');

create trigger trg_applications_updated_at
  before update on public.doctor_applications
  for each row execute function update_updated_at();

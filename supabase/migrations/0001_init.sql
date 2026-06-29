-- ============================================================
-- JURGH Car Detailing — Klantenportaal
-- Migration 0001: schema (MVP test-slice)
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
do $$ begin
  create type user_role as enum ('admin', 'medewerker', 'klant');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_type as enum ('glascoating', 'ppf', 'detailing', 'upgrade');
exception when duplicate_object then null; end $$;

-- Volgorde van statussen zoals in de projectflow (sectie 9)
do $$ begin
  create type project_status as enum (
    'concept',
    'offerte_aangevraagd',
    'offerte_verstuurd',
    'goedgekeurd',
    'afspraak_ingepland',
    'auto_ontvangen',
    'in_behandeling',
    'wacht_op_klant',
    'kwaliteitscontrole',
    'klaar_voor_oplevering',
    'afgerond',
    'gefactureerd',
    'gearchiveerd'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type document_type as enum ('offerte', 'factuur', 'certificaat', 'overig');
exception when duplicate_object then null; end $$;

do $$ begin
  create type photo_label as enum (
    'voor_behandeling',
    'tijdens_behandeling',
    'na_behandeling',
    'schade_bijzonderheid',
    'detailfoto',
    'oplevering'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type work_type as enum (
    'wassen', 'polijsten', 'glascoating', 'ppf_montage', 'interieur',
    'inspectie', 'correctie', 'schadeherstel', 'oplevering', 'overig'
  );
exception when duplicate_object then null; end $$;

-- ---------- profiles (1-op-1 met auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        user_role   not null default 'klant',
  full_name   text        not null default '',
  phone       text,
  created_at  timestamptz not null default now()
);

-- ---------- customers ----------
create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  -- koppeling naar het klant-login account (optioneel: een klant kan ook zonder login bestaan)
  profile_id  uuid references public.profiles (id) on delete set null,
  name        text not null,
  email       text,
  phone       text,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ---------- vehicles ----------
create table if not exists public.vehicles (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers (id) on delete cascade,
  license_plate text not null,
  make          text,
  model         text,
  year          int,
  color         text,
  mileage       int,
  photo_url     text,
  created_at    timestamptz not null default now()
);

-- ---------- projects ----------
create table if not exists public.projects (
  id                     uuid primary key default gen_random_uuid(),
  customer_id            uuid not null references public.customers (id) on delete restrict,
  vehicle_id             uuid not null references public.vehicles (id) on delete restrict,
  title                  text not null,
  type                   project_type not null default 'detailing',
  status                 project_status not null default 'concept',
  price                  numeric(10,2),
  discount               numeric(10,2) default 0,
  price_note             text,
  start_date             date,
  appointment_date       date,
  expected_delivery_date date,
  internal_notes         text,
  customer_notes         text,
  completed_at           timestamptz,
  created_by             uuid references public.profiles (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ---------- project_status_history ----------
create table if not exists public.project_status_history (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  status      project_status not null,
  note        text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---------- project_photos ----------
create table if not exists public.project_photos (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects (id) on delete cascade,
  storage_path        text not null,
  label               photo_label not null default 'tijdens_behandeling',
  caption             text,
  visible_to_customer boolean not null default true,
  uploaded_by         uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now()
);

-- ---------- project_remarks (bijzonderheden) ----------
create table if not exists public.project_remarks (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects (id) on delete cascade,
  body                text not null,
  visible_to_customer boolean not null default true,
  created_by          uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now()
);

-- ---------- project_documents ----------
create table if not exists public.project_documents (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  type          document_type not null default 'overig',
  name          text not null,
  storage_path  text not null,
  uploaded_by   uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ---------- work_logs (urenregistratie) ----------
create table if not exists public.work_logs (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  employee_id   uuid references public.profiles (id) on delete set null,
  log_date      date not null default current_date,
  work_type     work_type not null default 'overig',
  hours         numeric(5,2) not null default 0,
  description   text,
  internal_note text,
  created_at    timestamptz not null default now()
);

-- ---------- indexes ----------
create index if not exists idx_vehicles_customer    on public.vehicles (customer_id);
create index if not exists idx_projects_customer    on public.projects (customer_id);
create index if not exists idx_projects_vehicle     on public.projects (vehicle_id);
create index if not exists idx_status_hist_project  on public.project_status_history (project_id);
create index if not exists idx_photos_project       on public.project_photos (project_id);
create index if not exists idx_remarks_project      on public.project_remarks (project_id);
create index if not exists idx_documents_project    on public.project_documents (project_id);
create index if not exists idx_worklogs_project     on public.work_logs (project_id);
create index if not exists idx_worklogs_employee    on public.work_logs (employee_id);

-- ---------- triggers ----------
-- houd updated_at bij op projects
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_projects_touch on public.projects;
create trigger trg_projects_touch
  before update on public.projects
  for each row execute function public.touch_updated_at();

-- Log statuswijziging automatisch in de historie
create or replace function public.log_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.project_status_history (project_id, status, created_by)
    values (new.id, new.status, new.created_by);
  end if;
  return new;
end $$;

drop trigger if exists trg_projects_status on public.projects;
create trigger trg_projects_status
  after insert or update of status on public.projects
  for each row execute function public.log_status_change();

-- Maak automatisch een profiel aan wanneer een auth user wordt aangemaakt.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'klant'),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

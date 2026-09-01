-- ============================================================
-- JURGH portaal — VOLLEDIGE SETUP IN ÉÉN BESTAND
-- Plak dit complete bestand in Supabase → SQL Editor → Run.
-- Bevat: schema (0001) + RLS (0002) + storage (0003) + auto-foto's (0004)
--        + meerwerk (0005) + workflow-uitbreidingen (0006)
--        + projecttypes & kenteken (0007) + seed.
--        Veilig opnieuw te draaien (idempotent).
-- ============================================================

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

-- ============================================================
-- Migration 0002: Row Level Security
-- Rollen: admin, medewerker (staff) zien alles; klant ziet alleen eigen data.
-- ============================================================

-- Helper: huidige rol ophalen
create or replace function public.current_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() in ('admin','medewerker'), false);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() = 'admin', false);
$$;

-- Customer-ids die bij de ingelogde klant horen
create or replace function public.owns_customer(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.customers c
    where c.id = cid and c.profile_id = auth.uid()
  );
$$;

create or replace function public.owns_project(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.projects p
    join public.customers c on c.id = p.customer_id
    where p.id = pid and c.profile_id = auth.uid()
  );
$$;

-- ---------- enable RLS ----------
alter table public.profiles               enable row level security;
alter table public.customers              enable row level security;
alter table public.vehicles               enable row level security;
alter table public.projects               enable row level security;
alter table public.project_status_history enable row level security;
alter table public.project_photos         enable row level security;
alter table public.project_remarks        enable row level security;
alter table public.project_documents      enable row level security;
alter table public.work_logs              enable row level security;

-- ---------- profiles ----------
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (id = auth.uid() or public.is_staff());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- customers ----------
drop policy if exists customers_read on public.customers;
create policy customers_read on public.customers
  for select using (public.is_staff() or profile_id = auth.uid());

drop policy if exists customers_staff_write on public.customers;
create policy customers_staff_write on public.customers
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------- vehicles ----------
drop policy if exists vehicles_read on public.vehicles;
create policy vehicles_read on public.vehicles
  for select using (public.is_staff() or public.owns_customer(customer_id));

drop policy if exists vehicles_staff_write on public.vehicles;
create policy vehicles_staff_write on public.vehicles
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------- projects ----------
drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects
  for select using (public.is_staff() or public.owns_customer(customer_id));

-- medewerker mag bijwerken (status, notities) maar prijzen blijven via app-logica admin-only
drop policy if exists projects_staff_write on public.projects;
create policy projects_staff_write on public.projects
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------- project_status_history ----------
drop policy if exists status_read on public.project_status_history;
create policy status_read on public.project_status_history
  for select using (public.is_staff() or public.owns_project(project_id));

drop policy if exists status_staff_write on public.project_status_history;
create policy status_staff_write on public.project_status_history
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------- project_photos ----------
-- klant ziet alleen foto's die expliciet zichtbaar zijn gemaakt
drop policy if exists photos_read on public.project_photos;
create policy photos_read on public.project_photos
  for select using (
    public.is_staff()
    or (visible_to_customer and public.owns_project(project_id))
  );

drop policy if exists photos_staff_write on public.project_photos;
create policy photos_staff_write on public.project_photos
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------- project_remarks ----------
drop policy if exists remarks_read on public.project_remarks;
create policy remarks_read on public.project_remarks
  for select using (
    public.is_staff()
    or (visible_to_customer and public.owns_project(project_id))
  );

drop policy if exists remarks_staff_write on public.project_remarks;
create policy remarks_staff_write on public.project_remarks
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------- project_documents ----------
drop policy if exists documents_read on public.project_documents;
create policy documents_read on public.project_documents
  for select using (public.is_staff() or public.owns_project(project_id));

drop policy if exists documents_staff_write on public.project_documents;
create policy documents_staff_write on public.project_documents
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------- work_logs ----------
-- staff ziet alle uren; klant ziet ze niet (intern)
drop policy if exists worklogs_read on public.work_logs;
create policy worklogs_read on public.work_logs
  for select using (public.is_staff());

drop policy if exists worklogs_staff_write on public.work_logs;
create policy worklogs_staff_write on public.work_logs
  for all using (public.is_staff()) with check (public.is_staff());

-- ============================================================
-- Migration 0003: Storage buckets + policies
-- Twee private buckets: 'project-photos' en 'project-documents'.
-- Bestandspad-conventie: <project_id>/<bestandsnaam>
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('project-photos', 'project-photos', false),
  ('project-documents', 'project-documents', false)
on conflict (id) do nothing;

-- Helper: project_id uit het storage-pad (eerste map) halen
create or replace function public.path_project_id(name text)
returns uuid language sql immutable as $$
  select nullif(split_part(name, '/', 1), '')::uuid;
$$;

-- ---------- project-photos ----------
drop policy if exists "photos staff read" on storage.objects;
create policy "photos staff read" on storage.objects
  for select using (
    bucket_id = 'project-photos' and public.is_staff()
  );

drop policy if exists "photos customer read" on storage.objects;
create policy "photos customer read" on storage.objects
  for select using (
    bucket_id = 'project-photos'
    and public.owns_project(public.path_project_id(name))
    and exists (
      select 1 from public.project_photos p
      where p.storage_path = storage.objects.name
        and p.visible_to_customer
    )
  );

drop policy if exists "photos staff write" on storage.objects;
create policy "photos staff write" on storage.objects
  for insert with check (
    bucket_id = 'project-photos' and public.is_staff()
  );

drop policy if exists "photos staff modify" on storage.objects;
create policy "photos staff modify" on storage.objects
  for update using (bucket_id = 'project-photos' and public.is_staff());

drop policy if exists "photos staff delete" on storage.objects;
create policy "photos staff delete" on storage.objects
  for delete using (bucket_id = 'project-photos' and public.is_staff());

-- ---------- project-documents ----------
drop policy if exists "docs staff read" on storage.objects;
create policy "docs staff read" on storage.objects
  for select using (
    bucket_id = 'project-documents' and public.is_staff()
  );

drop policy if exists "docs customer read" on storage.objects;
create policy "docs customer read" on storage.objects
  for select using (
    bucket_id = 'project-documents'
    and public.owns_project(public.path_project_id(name))
  );

drop policy if exists "docs staff write" on storage.objects;
create policy "docs staff write" on storage.objects
  for insert with check (
    bucket_id = 'project-documents' and public.is_staff()
  );

drop policy if exists "docs staff modify" on storage.objects;
create policy "docs staff modify" on storage.objects
  for update using (bucket_id = 'project-documents' and public.is_staff());

drop policy if exists "docs staff delete" on storage.objects;
create policy "docs staff delete" on storage.objects
  for delete using (bucket_id = 'project-documents' and public.is_staff());

-- ============================================================
-- Migration 0004: Auto-foto's
-- Publieke bucket 'vehicle-photos' voor de hoofdfoto per auto.
-- (Auto-foto's zijn niet gevoelig; publieke read houdt CarThumb simpel.)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true)
on conflict (id) do update set public = true;

-- Publieke read (naast de automatische public-URL toegang).
drop policy if exists "vehicle photos public read" on storage.objects;
create policy "vehicle photos public read" on storage.objects
  for select using (bucket_id = 'vehicle-photos');

-- Alleen staff mag uploaden/wijzigen/verwijderen.
drop policy if exists "vehicle photos staff write" on storage.objects;
create policy "vehicle photos staff write" on storage.objects
  for insert with check (bucket_id = 'vehicle-photos' and public.is_staff());

drop policy if exists "vehicle photos staff modify" on storage.objects;
create policy "vehicle photos staff modify" on storage.objects
  for update using (bucket_id = 'vehicle-photos' and public.is_staff());

drop policy if exists "vehicle photos staff delete" on storage.objects;
create policy "vehicle photos staff delete" on storage.objects
  for delete using (bucket_id = 'vehicle-photos' and public.is_staff());

-- ============================================================
-- Migration 0005: Meerwerk / minderwerk (extra_work)
-- Medewerker legt meerwerk vast; klant kan accepteren of afwijzen.
-- ============================================================

do $$ begin
  create type extra_work_status as enum (
    'voorgesteld', 'intern_akkoord', 'klant_akkoord', 'uitgevoerd', 'afgewezen'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.extra_work (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects (id) on delete cascade,
  title           text not null,
  description     text,
  price           numeric(10,2) default 0,   -- negatief = minderwerk
  estimated_hours numeric(5,2) default 0,
  status          extra_work_status not null default 'voorgesteld',
  created_by      uuid references public.profiles (id) on delete set null,
  decided_at      timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_extra_work_project on public.extra_work (project_id);

alter table public.extra_work enable row level security;

-- Klant ziet meerwerk van eigen projecten (behalve puur interne tussenstap).
drop policy if exists extra_work_read on public.extra_work;
create policy extra_work_read on public.extra_work
  for select using (
    public.is_staff()
    or (public.owns_project(project_id) and status <> 'intern_akkoord')
  );

-- Staff beheert meerwerk volledig.
drop policy if exists extra_work_staff_write on public.extra_work;
create policy extra_work_staff_write on public.extra_work
  for all using (public.is_staff()) with check (public.is_staff());

-- Klant accepteert/wijst af via een veilige functie (geen directe UPDATE-rechten).
create or replace function public.respond_extra_work(p_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.extra_work
    set status = (case when p_accept then 'klant_akkoord' else 'afgewezen' end)::extra_work_status,
        decided_at = now()
  where id = p_id
    and status in ('voorgesteld', 'intern_akkoord')
    and public.owns_project(project_id);
end $$;

grant execute on function public.respond_extra_work(uuid, boolean) to authenticated;

-- ============================================================
-- Migration 0006: workflow-uitbreidingen
-- - projects: leenauto + transport
-- - customers: bedrijfsgegevens (zakelijk/particulier) + herinneringsvoorkeur
-- - extra_work: prijsmodel (per uur / totaal) + concept-status vóór verzenden
-- - extra_work_catalog: vaste meerwerk-opties om uit te kiezen
-- - RLS: medewerker verliest schrijftoegang tot projects/extra_work/documenten
--   en mag alleen eigen urenregistraties bewerken
-- ============================================================

-- ---------- projects: leenauto & transport ----------
alter table public.projects add column if not exists loaner_car boolean not null default false;
alter table public.projects add column if not exists loaner_car_plate text;
alter table public.projects add column if not exists transport boolean not null default false;

-- ---------- customers: bedrijfsgegevens & voorkeuren ----------
alter table public.customers add column if not exists company_name text;
alter table public.customers add column if not exists is_business boolean not null default false;
alter table public.customers add column if not exists reminders_enabled boolean not null default true;

-- ---------- extra_work: prijsmodel ----------
alter table public.extra_work add column if not exists pricing_mode text not null default 'totaal';

alter table public.extra_work drop constraint if exists extra_work_pricing_mode_check;
alter table public.extra_work add constraint extra_work_pricing_mode_check
  check (pricing_mode in ('per_uur', 'totaal'));

-- ---------- extra_work: concept-status vóór 'voorgesteld' ----------
-- (concept = nog niet verstuurd naar klant, alleen zichtbaar voor staff)
-- Kolom omgezet van enum naar text + check-constraint: een nieuwe waarde
-- toevoegen aan een bestaand enum-type (ALTER TYPE ... ADD VALUE) mag door
-- Postgres niet in dezelfde transactie gebruikt worden, en de SQL Editor
-- voert een volledige paste als één transactie uit — dat blokkeerde het
-- gebruik van 'concept' verderop in dit script. Text + check heeft die
-- beperking niet.
-- De bestaande policy verwijst naar de status-kolom, dus die moet eerst weg
-- voordat het kolomtype gewijzigd mag worden (Postgres staat dat niet toe
-- op een kolom waar een policy nog van afhangt).
drop policy if exists extra_work_read on public.extra_work;

alter table public.extra_work alter column status drop default;
alter table public.extra_work alter column status type text using status::text;
alter table public.extra_work alter column status set default 'concept';

alter table public.extra_work drop constraint if exists extra_work_status_check;
alter table public.extra_work add constraint extra_work_status_check
  check (status in ('concept', 'voorgesteld', 'intern_akkoord', 'klant_akkoord', 'uitgevoerd', 'afgewezen'));

-- extra_work_read moet 'concept' ook afschermen voor de klant (naast intern_akkoord)
create policy extra_work_read on public.extra_work
  for select using (
    public.is_staff()
    or (public.owns_project(project_id) and status not in ('intern_akkoord', 'concept'))
  );

-- ---------- extra_work_catalog: vaste meerwerk-opties (catalogus) ----------
create table if not exists public.extra_work_catalog (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  price           numeric(10,2) default 0,
  estimated_hours numeric(5,2) default 0,
  pricing_mode    text not null default 'totaal',
  created_at      timestamptz not null default now()
);

alter table public.extra_work_catalog drop constraint if exists extra_work_catalog_pricing_mode_check;
alter table public.extra_work_catalog add constraint extra_work_catalog_pricing_mode_check
  check (pricing_mode in ('per_uur', 'totaal'));

alter table public.extra_work_catalog enable row level security;

drop policy if exists extra_work_catalog_read on public.extra_work_catalog;
create policy extra_work_catalog_read on public.extra_work_catalog
  for select using (public.is_staff());

drop policy if exists extra_work_catalog_admin_write on public.extra_work_catalog;
create policy extra_work_catalog_admin_write on public.extra_work_catalog
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- RLS: rechten van medewerker inperken
-- Medewerker had via is_staff() volledige schrijftoegang tot projects,
-- extra_work en documenten. Nu: alleen admin mag deze wijzigen; medewerker
-- werkt uitsluitend nog via foto's, bijzonderheden en eigen urenregistratie.
-- ============================================================

-- projects: status/prijs/etc. alleen door admin te wijzigen
drop policy if exists projects_staff_write on public.projects;
drop policy if exists projects_admin_write on public.projects;
create policy projects_admin_write on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

-- extra_work: alleen admin beheert meerwerk
drop policy if exists extra_work_staff_write on public.extra_work;
drop policy if exists extra_work_admin_write on public.extra_work;
create policy extra_work_admin_write on public.extra_work
  for all using (public.is_admin()) with check (public.is_admin());

-- project_documents: medewerker verliest zowel lees- als schrijftoegang
drop policy if exists documents_read on public.project_documents;
create policy documents_read on public.project_documents
  for select using (public.is_admin() or public.owns_project(project_id));

drop policy if exists documents_staff_write on public.project_documents;
drop policy if exists documents_admin_write on public.project_documents;
create policy documents_admin_write on public.project_documents
  for all using (public.is_admin()) with check (public.is_admin());

-- work_logs: medewerker mag alleen eigen registraties aanmaken/bewerken,
-- admin mag alles; verwijderen blijft admin-only.
drop policy if exists worklogs_staff_write on public.work_logs;

drop policy if exists worklogs_insert on public.work_logs;
create policy worklogs_insert on public.work_logs
  for insert with check (public.is_admin() or employee_id = auth.uid());

drop policy if exists worklogs_update on public.work_logs;
create policy worklogs_update on public.work_logs
  for update using (public.is_admin() or employee_id = auth.uid())
  with check (public.is_admin() or employee_id = auth.uid());

drop policy if exists worklogs_delete on public.work_logs;
create policy worklogs_delete on public.work_logs
  for delete using (public.is_admin());

-- ============================================================
-- Migration 0007: projecttypes + kenteken
-- - projects.type: enum -> text + check, met de nieuwe types
--   wrap, schadeherstel en overig
-- - vehicles.license_plate: mag leeg blijven (kenteken is bij het
--   aanmaken van een project niet altijd bekend)
-- ============================================================

-- ---------- projects.type: enum -> text ----------
-- Waarom geen 'alter type project_type add value': Postgres staat het gebruik
-- van een net toegevoegde enum-waarde niet toe in dezelfde transactie, en de
-- Supabase SQL Editor voert een volledige paste als één transactie uit. Text +
-- check-constraint heeft die beperking niet en maakt een volgend projecttype
-- een kwestie van één waarde toevoegen.
alter table public.projects alter column type drop default;
alter table public.projects alter column type type text using type::text;
alter table public.projects alter column type set default 'detailing';

alter table public.projects drop constraint if exists projects_type_check;
alter table public.projects add constraint projects_type_check
  check (type in (
    'glascoating', 'ppf', 'detailing', 'upgrade',
    'wrap', 'schadeherstel', 'overig'
  ));

-- ---------- vehicles.license_plate: niet meer verplicht ----------
-- Lege strings die eerder als "onbekend" zijn ingevoerd worden null, zodat de
-- app maar één lege waarde hoeft te herkennen.
alter table public.vehicles alter column license_plate drop not null;
update public.vehicles set license_plate = null where btrim(license_plate) = '';

-- ============================================================
-- JURGH portaal — SEED (browser-only, geen lokale tooling nodig)
--
-- Draai DIT pas NA de migraties 0001 → 0002 → 0003.
-- Plak dit volledige bestand in: Supabase Dashboard → SQL Editor → Run.
--
-- Maakt testaccounts aan + demo-dossiers. Volledig idempotent:
-- je mag het meerdere keren draaien zonder dubbele data.
--
-- Wachtwoord voor de JURGH-testaccounts: JurghTest123!
--   admin@jurgh.test       → admin
--   medewerker@jurgh.test  → medewerker
--   klant@jurgh.test       → klant (met demo-auto + project)
--
-- Wachtwoord voor de M7 Branding-testaccounts: 123123123
--   alexander@m7branding.com       → admin
--   alexander_koselka@hotmail.com  → klant
--   test@detailing.nl              → medewerker
--
-- Medewerkers van JURGH (wachtwoord: JurghTest123!):
--   duncan@detailing.nl, tijmen@detailing.nl, hidde@detailing.nl,
--   sem@detailing.nl, inta@detailing.nl, bram@detailing.nl
-- ============================================================

-- ---------- 1. Testgebruikers in auth schema ----------
-- Helper die een auth user + e-mail identity aanmaakt als die nog niet bestaat,
-- en de profielrol zet (de handle_new_user trigger maakt het profiel al aan).
do $$
declare
  rec record;
  uid uuid;
begin
  for rec in
    select * from (values
      ('admin@jurgh.test',              'admin',      'JURGH Admin',       'JurghTest123!'),
      ('medewerker@jurgh.test',         'medewerker', 'JURGH Medewerker',  'JurghTest123!'),
      ('klant@jurgh.test',              'klant',      'Jan de Vries',      'JurghTest123!'),
      ('alexander@m7branding.com',      'admin',      'Alexander',         '123123123'),
      ('alexander_koselka@hotmail.com', 'klant',      'Alexander Koselka', '123123123'),
      ('test@detailing.nl',             'medewerker', 'Medewerker',        '123123123'),
      ('duncan@detailing.nl',           'medewerker', 'Duncan',            'JurghTest123!'),
      ('tijmen@detailing.nl',           'medewerker', 'Tijmen',            'JurghTest123!'),
      ('hidde@detailing.nl',            'medewerker', 'Hidde',             'JurghTest123!'),
      ('sem@detailing.nl',              'medewerker', 'Sem',               'JurghTest123!'),
      ('inta@detailing.nl',             'medewerker', 'Inta',              'JurghTest123!'),
      ('bram@detailing.nl',             'medewerker', 'Bram',              'JurghTest123!'),
      ('tijmen@detailing.nl',                  'medewerker', 'Tijmen',            'JurghTest123!'),
      ('hidde@detailing.nl',                   'medewerker', 'Hidde',             'JurghTest123!'),
      ('sem@detailing.nl',                     'medewerker', 'Sem',               'JurghTest123!'),
      ('inta@detailing.nl',                    'medewerker', 'Inta',              'JurghTest123!'),
      ('bram@detailing.nl',                    'medewerker', 'Bram',              'JurghTest123!')
    ) as t(email, role, full_name, password)
  loop
    select id into uid from auth.users where email = rec.email;

    if uid is null then
      uid := gen_random_uuid();

      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) values (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
        rec.email, crypt(rec.password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('role', rec.role, 'full_name', rec.full_name),
        now(), now(), '', '', '', ''
      );

      insert into auth.identities (
        provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        uid::text, uid,
        jsonb_build_object('sub', uid::text, 'email', rec.email),
        'email', now(), now(), now()
      );
    else
      -- account bestaat al: zorg dat het testwachtwoord klopt (handig na een reset)
      update auth.users set encrypted_password = crypt(rec.password, gen_salt('bf')) where id = uid;
    end if;

    -- zorg dat het profiel de juiste rol heeft (idempotent)
    insert into public.profiles (id, role, full_name)
    values (uid, rec.role::user_role, rec.full_name)
    on conflict (id) do update set role = excluded.role, full_name = excluded.full_name;
  end loop;
end $$;

-- ---------- 2. Demo-dossier voor de klant ----------
do $$
declare
  klant_uid   uuid;
  admin_uid   uuid;
  cust_id     uuid;
  veh_id      uuid;
  proj_exists boolean;
begin
  select id into klant_uid from auth.users where email = 'klant@jurgh.test';
  select id into admin_uid from auth.users where email = 'admin@jurgh.test';

  -- klant-record gekoppeld aan het login-account
  select id into cust_id from public.customers where profile_id = klant_uid;
  if cust_id is null then
    insert into public.customers (profile_id, name, email, phone)
    values (klant_uid, 'Jan de Vries', 'klant@jurgh.test', '+31 6 12345678')
    returning id into cust_id;
  end if;

  -- demo-auto
  select id into veh_id from public.vehicles where customer_id = cust_id limit 1;
  if veh_id is null then
    insert into public.vehicles (customer_id, license_plate, make, model, year, color, mileage)
    values (cust_id, 'X-001-JG', 'Porsche', '911 Carrera', 2023, 'GT Silver', 8400)
    returning id into veh_id;
  end if;

  -- demo-project
  select exists(select 1 from public.projects where vehicle_id = veh_id) into proj_exists;
  if not proj_exists then
    insert into public.projects (
      customer_id, vehicle_id, title, type, status, price,
      start_date, appointment_date, customer_notes, created_by
    ) values (
      cust_id, veh_id, 'Glascoating First Class — Porsche 911', 'glascoating',
      'in_behandeling', 1895.00, current_date, current_date,
      'Welkom in je JURGH dossier. Hier volg je live de voortgang.', admin_uid
    );
  end if;
end $$;

-- Klaar. Log in op het portaal met een van de accounts hierboven.

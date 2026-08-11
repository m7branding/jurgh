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
alter type extra_work_status add value if not exists 'concept' before 'voorgesteld';

-- extra_work_read moet 'concept' ook afschermen voor de klant (naast intern_akkoord)
drop policy if exists extra_work_read on public.extra_work;
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
create policy projects_admin_write on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

-- extra_work: alleen admin beheert meerwerk
drop policy if exists extra_work_staff_write on public.extra_work;
create policy extra_work_admin_write on public.extra_work
  for all using (public.is_admin()) with check (public.is_admin());

-- project_documents: medewerker verliest zowel lees- als schrijftoegang
drop policy if exists documents_read on public.project_documents;
create policy documents_read on public.project_documents
  for select using (public.is_admin() or public.owns_project(project_id));

drop policy if exists documents_staff_write on public.project_documents;
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

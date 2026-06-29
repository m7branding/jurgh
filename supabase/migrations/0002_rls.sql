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

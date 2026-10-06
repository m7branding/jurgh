-- ============================================================
-- Migration 0009: publiceren naar de klant
--
-- Publiceren staat náást de status: een project doorloopt zijn eigen
-- flow (concept → … → afgerond), en los daarvan bepaalt de admin vanaf
-- welk moment de klant het mag zien. Intrekken kan dus ook, zonder de
-- status aan te raken.
--
-- De afscherming zit in RLS, niet alleen in de UI.
-- ============================================================

alter table public.projects add column if not exists published_at timestamptz;
alter table public.projects add column if not exists published_by uuid
  references public.profiles (id) on delete set null;

create index if not exists idx_projects_published on public.projects (published_at);

-- ---------- klant ziet alleen gepubliceerde projecten ----------
-- owns_project() is de poort voor foto's, bijzonderheden, documenten en
-- meerwerk. Eén regel erbij schermt die allemaal tegelijk af.
create or replace function public.owns_project(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.projects p
    join public.customers c on c.id = p.customer_id
    where p.id = pid
      and c.profile_id = auth.uid()
      and p.published_at is not null
  );
$$;

-- projects_read gaat via owns_customer (per klant), dus die heeft een
-- eigen publicatiecontrole nodig.
drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects
  for select using (
    public.is_staff()
    or (public.owns_customer(customer_id) and published_at is not null)
  );

-- ---------- logboek van uitnodigingen en meldingen ----------
-- In de droogloopstand wordt de inloglink hier bewaard in plaats van
-- gemaild. Let op: zo'n link ís een sleutel tot het klantdossier en is
-- beperkt houdbaar — daarom alleen leesbaar voor admin.
create table if not exists public.portal_invites (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete cascade,
  project_id  uuid references public.projects (id) on delete set null,
  email       text not null,
  kind        text not null default 'uitnodiging',
  status      text not null default 'drooggelogd',
  action_link text,
  message     text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.portal_invites drop constraint if exists portal_invites_kind_check;
alter table public.portal_invites add constraint portal_invites_kind_check
  check (kind in ('uitnodiging', 'melding'));

alter table public.portal_invites drop constraint if exists portal_invites_status_check;
alter table public.portal_invites add constraint portal_invites_status_check
  check (status in ('drooggelogd', 'verstuurd', 'fout'));

create index if not exists idx_portal_invites_created
  on public.portal_invites (created_at desc);

alter table public.portal_invites enable row level security;

drop policy if exists portal_invites_admin_read on public.portal_invites;
create policy portal_invites_admin_read on public.portal_invites
  for select using (public.is_admin());

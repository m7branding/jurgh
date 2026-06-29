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

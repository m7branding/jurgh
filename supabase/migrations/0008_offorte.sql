-- ============================================================
-- Migration 0008: Offorte-koppeling
-- - customers/projects: herkomst vastleggen (welke offerte, welk contact)
-- - offorte_events: logboek van binnengekomen webhooks, zodat een
--   mislukte import terug te vinden is
-- ============================================================

-- ---------- herkomst op klant en project ----------
alter table public.customers add column if not exists offorte_contact_id bigint;

alter table public.projects add column if not exists offorte_proposal_id bigint;
alter table public.projects add column if not exists offorte_proposal_nr text;
alter table public.projects add column if not exists offorte_proposal_url text;

-- Eén offerte levert één project op. De webhook kan dubbel binnenkomen
-- (Offorte probeert het opnieuw bij een time-out), dus dit is de vangrail.
create unique index if not exists idx_projects_offorte_proposal
  on public.projects (offorte_proposal_id)
  where offorte_proposal_id is not null;

create index if not exists idx_customers_offorte_contact
  on public.customers (offorte_contact_id);

-- ---------- logboek van webhook-afleveringen ----------
create table if not exists public.offorte_events (
  id          uuid primary key default gen_random_uuid(),
  event_type  text not null,
  proposal_id bigint,
  status      text not null default 'ok',
  message     text,
  project_id  uuid references public.projects (id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.offorte_events drop constraint if exists offorte_events_status_check;
alter table public.offorte_events add constraint offorte_events_status_check
  check (status in ('ok', 'overgeslagen', 'genegeerd', 'fout'));

create index if not exists idx_offorte_events_created
  on public.offorte_events (created_at desc);

alter table public.offorte_events enable row level security;

-- Alleen admin leest mee; de webhook schrijft met de service-sleutel en
-- gaat sowieso langs RLS heen.
drop policy if exists offorte_events_admin_read on public.offorte_events;
create policy offorte_events_admin_read on public.offorte_events
  for select using (public.is_admin());

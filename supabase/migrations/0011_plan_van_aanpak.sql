-- ============================================================
-- Migration 0011: plan van aanpak als stappenlijn
--
-- - service_milestones: per dienst een vaste reeks stappen
-- - projects.current_step: bij welke stap het project nu is
--
-- De lijst die de klant ziet is: de stappen van de dienst, met daarachter
-- het meerwerk dat hij heeft geaccepteerd. current_step wijst in die
-- samengestelde lijst; leeg betekent dat er nog geen stap is aangewezen.
-- ============================================================

create table if not exists public.service_milestones (
  id           uuid primary key default gen_random_uuid(),
  project_type text not null,
  position     int  not null,
  title        text not null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_service_milestones_type
  on public.service_milestones (project_type, position);

alter table public.service_milestones enable row level security;

drop policy if exists service_milestones_read on public.service_milestones;
create policy service_milestones_read on public.service_milestones
  for select using (auth.uid() is not null);

drop policy if exists service_milestones_admin_write on public.service_milestones;
create policy service_milestones_admin_write on public.service_milestones
  for all using (public.is_admin()) with check (public.is_admin());

-- Beginset per dienst. Alleen voor diensten die nog geen stappen hebben, zodat
-- opnieuw draaien niets overschrijft wat er in het beheerscherm is aangepast.
insert into public.service_milestones (project_type, position, title)
select v.project_type, v.position, v.title
from (values
  ('glascoating',   1, 'Intake & inspectie'),
  ('glascoating',   2, 'Wassen & decontamineren'),
  ('glascoating',   3, 'Lakcorrectie'),
  ('glascoating',   4, 'Coating aanbrengen'),
  ('glascoating',   5, 'Uitharden'),
  ('glascoating',   6, 'Eindcontrole & oplevering'),

  ('ppf',           1, 'Intake & inspectie'),
  ('ppf',           2, 'Wassen & decontamineren'),
  ('ppf',           3, 'Panelen voorbereiden'),
  ('ppf',           4, 'PPF aanbrengen'),
  ('ppf',           5, 'Uitharden & nalopen'),
  ('ppf',           6, 'Eindcontrole & oplevering'),

  ('detailing',     1, 'Intake & inspectie'),
  ('detailing',     2, 'Interieur'),
  ('detailing',     3, 'Wassen & decontamineren'),
  ('detailing',     4, 'Polijsten'),
  ('detailing',     5, 'Bescherming'),
  ('detailing',     6, 'Eindcontrole & oplevering'),

  ('wrap',          1, 'Intake & inspectie'),
  ('wrap',          2, 'Reinigen & demonteren'),
  ('wrap',          3, 'Wrap aanbrengen'),
  ('wrap',          4, 'Monteren & nalopen'),
  ('wrap',          5, 'Eindcontrole & oplevering'),

  ('schadeherstel', 1, 'Schadeopname'),
  ('schadeherstel', 2, 'Uitdeuken & herstel'),
  ('schadeherstel', 3, 'Spuitwerk'),
  ('schadeherstel', 4, 'Polijsten & afwerken'),
  ('schadeherstel', 5, 'Eindcontrole & oplevering'),

  ('upgrade',       1, 'Intake'),
  ('upgrade',       2, 'Montage'),
  ('upgrade',       3, 'Testen'),
  ('upgrade',       4, 'Oplevering'),

  ('overig',        1, 'Intake'),
  ('overig',        2, 'Uitvoering'),
  ('overig',        3, 'Eindcontrole & oplevering')
) as v(project_type, position, title)
where not exists (
  select 1 from public.service_milestones s where s.project_type = v.project_type
);

-- ---------- huidige stap per project ----------
alter table public.projects add column if not exists current_step int;

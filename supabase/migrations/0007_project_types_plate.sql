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

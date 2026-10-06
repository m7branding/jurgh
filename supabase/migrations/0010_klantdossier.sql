-- ============================================================
-- Migration 0010: klantdossier — diensten, verzoeken en foto bij meerwerk
--
-- - service_links: per dienst één keer de webpagina en het plan van aanpak
-- - projects: klant kan leenauto en transport aanvragen (verzoek, geen vinkje)
-- - extra_work: status 'aangevraagd' voor upsells die de klant zelf aanvraagt
-- - project_photos.extra_work_id: één fotorij, zichtbaar bij de foto's én bij
--   het meerwerk waar hij bij hoort
-- - profiles.welcome_seen_count: eerste en tweede keer inloggen herkennen
-- ============================================================

-- ---------- links per dienst ----------
create table if not exists public.service_links (
  project_type text primary key,
  website_url  text,
  plan_url     text,
  updated_at   timestamptz not null default now()
);

insert into public.service_links (project_type)
values ('glascoating'), ('ppf'), ('detailing'), ('upgrade'),
       ('wrap'), ('schadeherstel'), ('overig')
on conflict (project_type) do nothing;

alter table public.service_links enable row level security;

-- De klant moet de links kunnen zien; beheren doet alleen de admin.
drop policy if exists service_links_read on public.service_links;
create policy service_links_read on public.service_links
  for select using (auth.uid() is not null);

drop policy if exists service_links_admin_write on public.service_links;
create policy service_links_admin_write on public.service_links
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- klant vraagt leenauto / transport aan ----------
-- Een verzoek is iets anders dan het vinkje: de klant vraagt, de admin kent toe.
alter table public.projects add column if not exists loaner_car_requested_at timestamptz;
alter table public.projects add column if not exists transport_requested_at  timestamptz;

create or replace function public.request_project_option(p_project_id uuid, p_kind text)
returns void language plpgsql security definer set search_path = public as $$
declare gewijzigd int;
begin
  if not public.owns_project(p_project_id) then
    raise exception 'Geen toegang tot dit project';
  end if;
  if p_kind not in ('leenauto', 'transport') then
    raise exception 'Onbekend verzoek';
  end if;

  if p_kind = 'leenauto' then
    update public.projects
      set loaner_car_requested_at = now()
      where id = p_project_id and loaner_car = false and loaner_car_requested_at is null;
  else
    update public.projects
      set transport_requested_at = now()
      where id = p_project_id and transport = false and transport_requested_at is null;
  end if;

  -- Niets gewijzigd betekent: al aangevraagd of al geregeld. Dan ook geen
  -- tweede regel in de tijdlijn, hoe vaak de knop ook geraakt wordt.
  get diagnostics gewijzigd = row_count;
  if gewijzigd = 0 then
    return;
  end if;

  -- zichtbaar in de tijdlijn, zodat niemand het verzoek mist
  insert into public.project_remarks (project_id, body, visible_to_customer)
  values (
    p_project_id,
    case when p_kind = 'leenauto'
      then 'Klant heeft een leenauto aangevraagd.'
      else 'Klant heeft transport (halen en brengen) aangevraagd.' end,
    true
  );
end $$;

grant execute on function public.request_project_option(uuid, text) to authenticated;

-- ---------- upsells die de klant zelf aanvraagt ----------
-- 'aangevraagd' komt vóór 'voorgesteld': de klant vraagt, de admin prijst af.
alter table public.extra_work drop constraint if exists extra_work_status_check;
alter table public.extra_work add constraint extra_work_status_check
  check (status in ('concept', 'aangevraagd', 'voorgesteld', 'intern_akkoord',
                    'klant_akkoord', 'uitgevoerd', 'afgewezen'));

-- De catalogus is de upsell-lijst die de klant te zien krijgt.
drop policy if exists extra_work_catalog_read on public.extra_work_catalog;
create policy extra_work_catalog_read on public.extra_work_catalog
  for select using (auth.uid() is not null);

create or replace function public.request_catalog_item(p_project_id uuid, p_catalog_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare item public.extra_work_catalog%rowtype;
begin
  if not public.owns_project(p_project_id) then
    raise exception 'Geen toegang tot dit project';
  end if;

  select * into item from public.extra_work_catalog where id = p_catalog_id;
  if not found then
    raise exception 'Onbekende optie';
  end if;

  -- niet twee keer hetzelfde aanvragen
  if exists (
    select 1 from public.extra_work
    where project_id = p_project_id and title = item.title
      and status in ('aangevraagd', 'voorgesteld', 'klant_akkoord', 'uitgevoerd')
  ) then
    return;
  end if;

  insert into public.extra_work (project_id, title, description, price, estimated_hours, pricing_mode, status)
  values (p_project_id, item.title, item.description, item.price, item.estimated_hours,
          item.pricing_mode, 'aangevraagd');
end $$;

grant execute on function public.request_catalog_item(uuid, uuid) to authenticated;

-- respond_extra_work stamde nog uit de tijd dat status een enum was (0006 maakte
-- er tekst van). Zonder de cast werkt hij ook na die omzetting.
create or replace function public.respond_extra_work(p_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.extra_work
    set status = case when p_accept then 'klant_akkoord' else 'afgewezen' end,
        decided_at = now()
  where id = p_id
    and status in ('voorgesteld', 'intern_akkoord')
    and public.owns_project(project_id);
end $$;

grant execute on function public.respond_extra_work(uuid, boolean) to authenticated;

-- ---------- foto bij meerwerk (één rij, twee plekken) ----------
alter table public.project_photos add column if not exists extra_work_id uuid
  references public.extra_work (id) on delete set null;

create index if not exists idx_photos_extra_work on public.project_photos (extra_work_id);

-- ---------- welkomstschermen ----------
-- 0 = nog nooit ingelogd, 1 = tweede bezoek, 2+ = geen welkom meer
alter table public.profiles add column if not exists welcome_seen_count int not null default 0;

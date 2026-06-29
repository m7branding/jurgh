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

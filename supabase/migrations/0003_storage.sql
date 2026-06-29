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

-- ============================================================
-- Migration 0012: klant leest foto's via de foto-rij, niet via de map
--
-- Tot nu toe mocht een klant een fotobestand openen als het in de map van
-- een project van hem stond (eerste deel van het pad) én er een zichtbare
-- foto-rij naar wees. Nu telt alleen die foto-rij: staat er in een
-- gepubliceerd project van de klant een zichtbare rij die naar het bestand
-- wijst, dan mag hij het zien.
--
-- Even streng, want alleen admin en medewerkers maken foto-rijen aan. Maar
-- zo kan hetzelfde bestand in twee projecten staan, zoals de foto's van het
-- demo-dossier, die uit het echte project komen.
-- ============================================================

drop policy if exists "photos customer read" on storage.objects;
create policy "photos customer read" on storage.objects
  for select using (
    bucket_id = 'project-photos'
    and exists (
      select 1 from public.project_photos p
      where p.storage_path = storage.objects.name
        and p.visible_to_customer
        and public.owns_project(p.project_id)
    )
  );

create index if not exists idx_photos_storage_path on public.project_photos (storage_path);

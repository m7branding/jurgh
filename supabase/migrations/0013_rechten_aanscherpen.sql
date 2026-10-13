-- ============================================================
-- Migration 0013: rechten aanscherpen
--
-- 1. Een ingelogde gebruiker mocht zijn eigen profiel bijwerken, inclusief
--    de rol. Een klant kon zich zo via de API tot admin maken. Nu mag alleen
--    een admin een rol wijzigen. Zonder ingelogde gebruiker (SQL Editor,
--    service role in de server-code) blijft het mogelijk, zodat seed en
--    publiceren blijven werken.
-- 2. Een nieuw account kreeg de rol uit de gebruikersgegevens die je bij
--    het aanmelden zelf meestuurt. Nu komt de rol alleen uit app_metadata
--    (alleen door de server te zetten); anders wordt het 'klant'.
-- 3. Uren: alleen staff mag eigen uren aanmaken of wijzigen, en niet
--    iedere ingelogde gebruiker met zijn eigen id.
-- ============================================================

-- ---------- 1. rol alleen door admin ----------
create or replace function public.profiles_bewaak_rol()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Alleen een admin kan een rol wijzigen' using errcode = '42501';
    end if;
    if new.id is distinct from old.id then
      raise exception 'Een profiel kan niet van gebruiker wisselen' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_profiles_bewaak_rol on public.profiles;
create trigger trg_profiles_bewaak_rol
  before update on public.profiles
  for each row execute function public.profiles_bewaak_rol();

-- ---------- 2. rol van een nieuw account ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce((new.raw_app_meta_data ->> 'role')::user_role, 'klant'),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- ---------- 3. uren alleen door staff ----------
drop policy if exists worklogs_insert on public.work_logs;
create policy worklogs_insert on public.work_logs
  for insert with check (
    public.is_admin() or (public.is_staff() and employee_id = auth.uid())
  );

drop policy if exists worklogs_update on public.work_logs;
create policy worklogs_update on public.work_logs
  for update using (
    public.is_admin() or (public.is_staff() and employee_id = auth.uid())
  )
  with check (
    public.is_admin() or (public.is_staff() and employee_id = auth.uid())
  );

-- ============================================================
-- JURGH portaal — SEED (browser-only, geen lokale tooling nodig)
--
-- Draai DIT pas NA de migraties 0001 → 0002 → 0003.
-- Plak dit volledige bestand in: Supabase Dashboard → SQL Editor → Run.
--
-- Maakt testaccounts aan + demo-dossiers. Volledig idempotent:
-- je mag het meerdere keren draaien zonder dubbele data.
--
-- Wachtwoord voor de JURGH-testaccounts: JurghTest123!
--   admin@jurgh.test       → admin
--   medewerker@jurgh.test  → medewerker
--   klant@jurgh.test       → klant (met demo-auto + project)
--
-- Wachtwoord voor de M7 Branding-testaccounts: 123123123
--   alexander@m7branding.com       → admin
--   alexander_koselka@hotmail.com  → klant (met 2 testprojecten)
-- ============================================================

-- ---------- 1. Testgebruikers in auth schema ----------
-- Helper die een auth user + e-mail identity aanmaakt als die nog niet bestaat,
-- en de profielrol zet (de handle_new_user trigger maakt het profiel al aan).
do $$
declare
  rec record;
  uid uuid;
begin
  for rec in
    select * from (values
      ('admin@jurgh.test',              'admin',      'JURGH Admin',       'JurghTest123!'),
      ('medewerker@jurgh.test',         'medewerker', 'JURGH Medewerker',  'JurghTest123!'),
      ('klant@jurgh.test',              'klant',      'Jan de Vries',      'JurghTest123!'),
      ('alexander@m7branding.com',      'admin',      'Alexander',         '123123123'),
      ('alexander_koselka@hotmail.com', 'klant',      'Alexander Koselka', '123123123')
    ) as t(email, role, full_name, password)
  loop
    select id into uid from auth.users where email = rec.email;

    if uid is null then
      uid := gen_random_uuid();

      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) values (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
        rec.email, crypt(rec.password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('role', rec.role, 'full_name', rec.full_name),
        now(), now(), '', '', '', ''
      );

      insert into auth.identities (
        provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        uid::text, uid,
        jsonb_build_object('sub', uid::text, 'email', rec.email),
        'email', now(), now(), now()
      );
    else
      -- account bestaat al: zorg dat het testwachtwoord klopt (handig na een reset)
      update auth.users set encrypted_password = crypt(rec.password, gen_salt('bf')) where id = uid;
    end if;

    -- zorg dat het profiel de juiste rol heeft (idempotent)
    insert into public.profiles (id, role, full_name)
    values (uid, rec.role::user_role, rec.full_name)
    on conflict (id) do update set role = excluded.role, full_name = excluded.full_name;
  end loop;
end $$;

-- ---------- 2. Demo-dossier voor de klant ----------
do $$
declare
  klant_uid   uuid;
  admin_uid   uuid;
  cust_id     uuid;
  veh_id      uuid;
  proj_exists boolean;
begin
  select id into klant_uid from auth.users where email = 'klant@jurgh.test';
  select id into admin_uid from auth.users where email = 'admin@jurgh.test';

  -- klant-record gekoppeld aan het login-account
  select id into cust_id from public.customers where profile_id = klant_uid;
  if cust_id is null then
    insert into public.customers (profile_id, name, email, phone)
    values (klant_uid, 'Jan de Vries', 'klant@jurgh.test', '+31 6 12345678')
    returning id into cust_id;
  end if;

  -- demo-auto
  select id into veh_id from public.vehicles where customer_id = cust_id limit 1;
  if veh_id is null then
    insert into public.vehicles (customer_id, license_plate, make, model, year, color, mileage)
    values (cust_id, 'X-001-JG', 'Porsche', '911 Carrera', 2023, 'GT Silver', 8400)
    returning id into veh_id;
  end if;

  -- demo-project
  select exists(select 1 from public.projects where vehicle_id = veh_id) into proj_exists;
  if not proj_exists then
    insert into public.projects (
      customer_id, vehicle_id, title, type, status, price,
      start_date, appointment_date, customer_notes, created_by
    ) values (
      cust_id, veh_id, 'Glascoating First Class — Porsche 911', 'glascoating',
      'in_behandeling', 1895.00, current_date, current_date,
      'Welkom in je JURGH dossier. Hier volg je live de voortgang.', admin_uid
    );
  end if;
end $$;

-- ---------- 3. Testprojecten voor Alexander Koselka (M7 Branding demo) ----------
do $$
declare
  klant_uid uuid;
  admin_uid uuid;
  cust_id   uuid;
  veh1_id   uuid;
  veh2_id   uuid;
begin
  select id into klant_uid from auth.users where email = 'alexander_koselka@hotmail.com';
  select id into admin_uid from auth.users where email = 'alexander@m7branding.com';

  -- klant-record gekoppeld aan het login-account
  select id into cust_id from public.customers where profile_id = klant_uid;
  if cust_id is null then
    insert into public.customers (profile_id, name, email)
    values (klant_uid, 'Alexander Koselka', 'alexander_koselka@hotmail.com')
    returning id into cust_id;
  end if;

  -- testauto 1: Renault 5 Alpine — status vroeg in de flow (open offerte, rood)
  select id into veh1_id from public.vehicles where customer_id = cust_id and license_plate = 'XX-001-M7';
  if veh1_id is null then
    insert into public.vehicles (customer_id, license_plate, make, model, year, color, mileage)
    values (cust_id, 'XX-001-M7', 'Renault', '5 Alpine', 2026, 'Alpine Blauw', 15)
    returning id into veh1_id;
  end if;

  if not exists (select 1 from public.projects where vehicle_id = veh1_id) then
    insert into public.projects (
      customer_id, vehicle_id, title, type, status, price,
      appointment_date, customer_notes, created_by
    ) values (
      cust_id, veh1_id, 'Detailing — Renault 5 Alpine', 'detailing', 'offerte_verstuurd', 895.00,
      current_date + 5, 'Offerte verstuurd, we wachten op akkoord.', admin_uid
    );
  end if;

  -- testauto 2: Hyundai Ioniq 9 — status aan het eind van de flow (auto opgehaald, blauw)
  select id into veh2_id from public.vehicles where customer_id = cust_id and license_plate = 'XX-002-M7';
  if veh2_id is null then
    insert into public.vehicles (customer_id, license_plate, make, model, year, color, mileage)
    values (cust_id, 'XX-002-M7', 'Hyundai', 'Ioniq 9', 2026, 'Titan Grijs', 420)
    returning id into veh2_id;
  end if;

  if not exists (select 1 from public.projects where vehicle_id = veh2_id) then
    insert into public.projects (
      customer_id, vehicle_id, title, type, status, price,
      appointment_date, completed_at, customer_notes, created_by
    ) values (
      cust_id, veh2_id, 'PPF volledige carrosserie — Hyundai Ioniq 9', 'ppf', 'afgerond', 3450.00,
      current_date - 3, now(), 'Klaar — auto is opgehaald.', admin_uid
    );
  end if;
end $$;

-- Klaar. Log in op het portaal met een van de accounts hierboven.

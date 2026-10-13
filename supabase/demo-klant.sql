-- ============================================================
-- JURGH portaal — DEMO-KLANT om te laten zien
--
-- Een klantaccount met één gevuld dossier, bedoeld om met JURGH te delen.
-- Plak dit bestand in Supabase → SQL Editor → Run.
--
--   Inloggen:   demo@jurgh.test
--   Wachtwoord: JurghDemo2026!
--
-- Het e-mailadres eindigt op .test en kan dus nooit mail ontvangen;
-- herinneringen staan uit. Het wachtwoord is bewust een ander dan dat van
-- de medewerker- en admin-testaccounts.
--
-- Opnieuw draaien zet het dossier terug in de beginstand: datums schuiven
-- mee met vandaag, aanvragen en antwoorden van de demo-bezoeker worden
-- gewist, het welkomstscherm komt weer. Foto's blijven staan.
-- ============================================================

do $$
declare
  demo_email constant text := 'demo@jurgh.test';
  demo_pw    constant text := 'JurghDemo2026!';
  vandaag    constant date := current_date;
  uid        uuid;
  admin_uid  uuid;
  mw1        uuid;
  mw2        uuid;
  cust_id    uuid;
  veh_id     uuid;
  proj_id    uuid;
begin
  -- ---------- 1. login-account ----------
  select id into uid from auth.users where email = demo_email;
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      demo_email, crypt(demo_pw, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('role', 'klant', 'full_name', 'Thomas Bakker'),
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      uid::text, uid,
      jsonb_build_object('sub', uid::text, 'email', demo_email),
      'email', now(), now(), now()
    );
  else
    update auth.users
       set encrypted_password = crypt(demo_pw, gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now())
     where id = uid;
  end if;

  -- welcome_seen_count = 0: het welkomstscherm verschijnt weer
  insert into public.profiles (id, role, full_name, welcome_seen_count)
  values (uid, 'klant', 'Thomas Bakker', 0)
  on conflict (id) do update
    set role = 'klant', full_name = excluded.full_name, welcome_seen_count = 0;

  -- wie er in het dossier "aan het werk" is
  select p.id into admin_uid from public.profiles p
    join auth.users u on u.id = p.id
   where p.role = 'admin'
   order by (u.email = 'admin@jurgh.test') desc, u.created_at
   limit 1;
  select id into mw1 from auth.users where email = 'duncan@detailing.nl';
  select id into mw2 from auth.users where email = 'sem@detailing.nl';

  -- ---------- 2. klant ----------
  -- "(demo)" in de naam, zodat niemand hem in de klantenlijst voor echt aanziet;
  -- de klant zelf ziet de naam van zijn profiel (Thomas Bakker).
  select id into cust_id from public.customers where profile_id = uid;
  if cust_id is null then
    insert into public.customers (profile_id, name, email) values (uid, 'Thomas Bakker (demo)', demo_email)
    returning id into cust_id;
  end if;
  update public.customers
     set name = 'Thomas Bakker (demo)',
         email = demo_email,
         phone = null,
         company_name = null,
         is_business = false,
         reminders_enabled = false,
         notes = 'Demo-account om het klantportaal te laten zien. Geen echte klant, niet factureren.'
   where id = cust_id;

  -- ---------- 3. auto ----------
  select id into veh_id from public.vehicles where customer_id = cust_id order by created_at limit 1;
  if veh_id is null then
    insert into public.vehicles (customer_id, license_plate) values (cust_id, 'X-999-JG')
    returning id into veh_id;
  end if;
  -- photo_url laten we staan: die zet je met het fotoknopje in de admin
  update public.vehicles
     set license_plate = 'X-999-JG',
         make = 'Porsche',
         model = '911 Carrera S',
         year = 2022,
         color = 'Gentiaanblauw metallic',
         mileage = 18450
   where id = veh_id;

  -- ---------- 4. project ----------
  select id into proj_id from public.projects where customer_id = cust_id order by created_at limit 1;
  if proj_id is null then
    insert into public.projects (customer_id, vehicle_id, title, type, status, created_by)
    values (cust_id, veh_id, 'Glascoating + lakcorrectie', 'glascoating', 'in_behandeling', admin_uid)
    returning id into proj_id;
  end if;

  update public.projects
     set vehicle_id = veh_id,
         title = 'Glascoating + lakcorrectie',
         type = 'glascoating',
         status = 'in_behandeling',
         price = 1895.00,
         discount = 0,
         start_date = vandaag - 3,
         appointment_date = vandaag - 3,
         expected_delivery_date = vandaag + 3,
         completed_at = null,
         created_at = ((vandaag - 16) + time '14:20') at time zone 'Europe/Amsterdam',
         published_at = ((vandaag - 15) + time '10:10') at time zone 'Europe/Amsterdam',
         published_by = admin_uid,
         plan_text = null,               -- standaardtekst van de dienst
         loaner_car = false,
         loaner_car_plate = null,
         transport = false,
         loaner_car_requested_at = null, -- aanvraagknoppen weer beschikbaar
         transport_requested_at = null,
         offorte_proposal_id = null,
         offorte_proposal_nr = null,
         offorte_proposal_url = null,
         internal_notes = 'DEMO-dossier om het klantportaal te laten zien. Niet factureren.',
         customer_notes = $t$Hoi Thomas, fijn dat je voor JURGH hebt gekozen. In dit dossier volg je hoe het met je 911 gaat: de foto's, het stappenplan en eventuele extra's. Vragen tussendoor? Bel of app ons gerust.$t$
   where id = proj_id;

  -- ---------- 5. tijdlijn ----------
  -- de trigger heeft bij het bijwerken zelf een regel gemaakt; we zetten de
  -- historie in één keer neer zoals een echt project hem zou hebben
  delete from public.project_status_history where project_id = proj_id;
  insert into public.project_status_history (project_id, status, note, created_by, created_at) values
    (proj_id, 'goedgekeurd',        'Offerte geaccordeerd',  admin_uid, ((vandaag - 16) + time '14:20') at time zone 'Europe/Amsterdam'),
    (proj_id, 'afspraak_ingepland', null,                    admin_uid, ((vandaag - 15) + time '10:05') at time zone 'Europe/Amsterdam'),
    (proj_id, 'auto_ontvangen',     null,                    admin_uid, ((vandaag - 3)  + time '08:40') at time zone 'Europe/Amsterdam'),
    (proj_id, 'in_behandeling',     null,                    admin_uid, ((vandaag - 3)  + time '11:30') at time zone 'Europe/Amsterdam');

  -- ---------- 6. opmerkingen ----------
  delete from public.project_remarks where project_id = proj_id;
  insert into public.project_remarks (project_id, body, visible_to_customer, created_by, created_at) values
    (proj_id,
     $t$Je 911 is binnen. Bij de intake hebben we de lak samen bekeken: lichte swirls op de motorkap en de portieren, en twee steenslagputjes in de voorbumper. De swirls nemen we mee in de lakcorrectie.$t$,
     true, admin_uid, ((vandaag - 3) + time '10:10') at time zone 'Europe/Amsterdam'),
    (proj_id,
     $t$Klant wil de auto het liefst vóór het weekend terug. Leenauto nog niet nodig.$t$,
     false, admin_uid, ((vandaag - 3) + time '15:45') at time zone 'Europe/Amsterdam'),
    (proj_id,
     $t$Wassen en decontamineren is klaar. De lak was er beter aan toe dan verwacht; morgen beginnen we met de lakcorrectie.$t$,
     true, admin_uid, ((vandaag - 2) + time '16:30') at time zone 'Europe/Amsterdam'),
    (proj_id,
     $t$Motorkap en portieren zijn gecorrigeerd, de swirls zijn weg. Vandaag doen we de achterkant en de dorpels, daarna kan de coating erop.$t$,
     true, admin_uid, ((vandaag - 1) + time '17:05') at time zone 'Europe/Amsterdam');

  -- ---------- 7. meerwerk ----------
  -- één al geaccepteerd, één dat nog op antwoord wacht (daar kan de bezoeker op klikken)
  delete from public.extra_work where project_id = proj_id;
  insert into public.extra_work
    (project_id, title, description, price, estimated_hours, pricing_mode, status, created_by, decided_at, created_at)
  values
    (proj_id, 'Velgen coaten',
     'Keramische coating op alle vier de velgen, ook aan de binnenkant. Remstof hecht minder en ze zijn makkelijker schoon te houden.',
     295.00, 2.5, 'totaal', 'klant_akkoord', admin_uid,
     ((vandaag - 3) + time '13:05') at time zone 'Europe/Amsterdam',
     ((vandaag - 3) + time '10:20') at time zone 'Europe/Amsterdam'),
    (proj_id, 'Steenslag bijwerken voorbumper',
     'De twee steenslagputjes in de voorbumper bijwerken met lak en wegpolijsten, voordat de coating erop gaat.',
     145.00, 1.5, 'totaal', 'voorgesteld', admin_uid,
     null,
     ((vandaag - 1) + time '17:10') at time zone 'Europe/Amsterdam');

  -- ---------- 8. uren (alleen zichtbaar in admin) ----------
  delete from public.work_logs where project_id = proj_id;
  insert into public.work_logs (project_id, employee_id, log_date, work_type, hours, description)
  select proj_id, w.emp, w.d, w.t::work_type, w.h, w.omschrijving
  from (values
    (coalesce(mw1, admin_uid), vandaag - 3, 'inspectie',  1.0, 'Intake en lakinspectie met de klant'),
    (coalesce(mw1, admin_uid), vandaag - 2, 'wassen',     3.5, 'Handwas, kleibehandeling en vliegroest verwijderen'),
    (coalesce(mw1, admin_uid), vandaag - 1, 'correctie',  7.0, 'Lakcorrectie motorkap en portieren'),
    (coalesce(mw2, admin_uid), vandaag - 1, 'correctie',  3.0, 'Lakcorrectie spiegels en A-stijlen')
  ) as w(emp, d, t, h, omschrijving);

  raise notice 'Demo-dossier klaar: project %', proj_id;
end $$;

-- Ter controle: het project en het account.
select p.id as project_id, p.title, p.status, p.published_at is not null as gepubliceerd,
       u.email as inloggen_met
  from public.projects p
  join public.customers c on c.id = p.customer_id
  join auth.users u on u.id = c.profile_id
 where u.email = 'demo@jurgh.test';

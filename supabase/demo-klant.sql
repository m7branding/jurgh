-- ============================================================
-- JURGH portaal — DEMO-KLANT om te laten zien
--
-- Een klantaccount met één volledig gevuld dossier, gebaseerd op het
-- bestaande Aston Martin Valhalla-project (PPF Diamant pakket). Het echte
-- project blijft onaangeroerd: de demo krijgt een eigen klant, auto en
-- project, en neemt alleen de autogegevens, de autofoto en de projectfoto's
-- over. Bedoeld om met JURGH te delen.
--
-- Plak dit bestand in Supabase → SQL Editor → Run, in het JURGH-project.
--
--   Inloggen:   demo@jurgh.test
--   Wachtwoord: JurghDemo2026!
--
-- Het e-mailadres eindigt op .test en kan dus nooit mail ontvangen;
-- herinneringen staan uit. Het wachtwoord is bewust een ander dan dat van
-- de medewerker- en admin-testaccounts.
--
-- Twee voorbeeldlinks, allebei een PDF op de portaalsite zelf:
--   📎 Jouw offerte   → /voorbeeld/offerte-voorbeeld.pdf
--   Wasinstructies    → /voorbeeld/wasinstructies-voorbeeld.pdf
--
-- Opnieuw draaien zet het dossier terug in de beginstand: datums schuiven
-- mee met vandaag, aanvragen en antwoorden van de demo-bezoeker worden
-- gewist, het welkomstscherm komt weer. Foto's die je zelf bij de demo
-- uploadt, blijven staan.
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
  -- bronproject: het echte Valhalla-project
  src_proj   uuid;
  src_veh    public.vehicles%rowtype;
  src_price  numeric;
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

  -- ---------- 3. het Valhalla-project als bron ----------
  select p.id, p.price into src_proj, src_price
    from public.projects p
    left join public.vehicles v on v.id = p.vehicle_id
   where p.customer_id <> cust_id
     and (p.title ilike '%valhalla%' or v.model ilike '%valhalla%')
   order by p.created_at
   limit 1;
  if src_proj is not null then
    select v.* into src_veh
      from public.vehicles v join public.projects p on p.vehicle_id = v.id
     where p.id = src_proj;
  else
    raise notice 'Geen Valhalla-project gevonden; de demo gebruikt standaardgegevens en heeft nog geen foto''s.';
  end if;

  -- ---------- 4. auto ----------
  select id into veh_id from public.vehicles where customer_id = cust_id order by created_at limit 1;
  if veh_id is null then
    insert into public.vehicles (customer_id, license_plate) values (cust_id, 'X-999-JG')
    returning id into veh_id;
  end if;
  -- Merk en type van het echte project, met een eigen kenteken. Een autofoto die
  -- je zelf bij de demo zet, blijft staan; anders die van het echte project.
  update public.vehicles
     set license_plate = 'X-999-JG',
         make     = coalesce(nullif(src_veh.make, ''),  'Aston Martin'),
         model    = coalesce(nullif(src_veh.model, ''), 'Valhalla'),
         year     = coalesce(src_veh.year, 2025),
         color    = coalesce(nullif(src_veh.color, ''), color),
         mileage  = coalesce(src_veh.mileage, 850),
         photo_url = coalesce(photo_url, src_veh.photo_url)
   where id = veh_id;

  -- ---------- 5. project ----------
  select id into proj_id from public.projects where customer_id = cust_id order by created_at limit 1;
  if proj_id is null then
    insert into public.projects (customer_id, vehicle_id, title, type, status, created_by)
    values (cust_id, veh_id, 'PPF Diamant pakket', 'ppf', 'in_behandeling', admin_uid)
    returning id into proj_id;
  end if;

  update public.projects
     set vehicle_id = veh_id,
         title = 'PPF Diamant pakket',
         type = 'ppf',
         status = 'in_behandeling',
         price = coalesce(src_price, 7985.00),
         discount = 0,
         start_date = vandaag - 4,
         appointment_date = vandaag - 4,
         expected_delivery_date = vandaag + 5,
         completed_at = null,
         created_at = ((vandaag - 16) + time '14:20') at time zone 'Europe/Amsterdam',
         published_at = ((vandaag - 15) + time '10:10') at time zone 'Europe/Amsterdam',
         published_by = admin_uid,
         plan_text = null,               -- standaardtekst van de dienst (PPF)
         loaner_car = false,
         loaner_car_plate = null,
         transport = false,
         loaner_car_requested_at = null, -- aanvraagknoppen weer beschikbaar
         transport_requested_at = null,
         -- voorbeeldlink: de paperclip "Jouw offerte" opent deze PDF
         offorte_proposal_id = null,
         offorte_proposal_nr = 'Voorbeeldofferte',
         offorte_proposal_url = '/voorbeeld/offerte-voorbeeld.pdf',
         internal_notes = 'DEMO-dossier om het klantportaal te laten zien. Niet factureren.',
         customer_notes = $t$Hoi Thomas, wat mooi dat we je Valhalla mogen beschermen. In dit dossier volg je hoe het ervoor staat: de foto's, het stappenplan en eventuele extra's. Vragen tussendoor? Bel of app ons gerust.$t$
   where id = proj_id;

  -- ---------- 6. tijdlijn ----------
  -- de trigger heeft bij het bijwerken zelf een regel gemaakt; we zetten de
  -- historie in één keer neer zoals een echt project hem zou hebben
  delete from public.project_status_history where project_id = proj_id;
  insert into public.project_status_history (project_id, status, note, created_by, created_at) values
    (proj_id, 'goedgekeurd',        'Offerte geaccordeerd', admin_uid, ((vandaag - 16) + time '14:20') at time zone 'Europe/Amsterdam'),
    (proj_id, 'afspraak_ingepland', null,                   admin_uid, ((vandaag - 15) + time '10:05') at time zone 'Europe/Amsterdam'),
    (proj_id, 'auto_ontvangen',     null,                   admin_uid, ((vandaag - 4)  + time '08:30') at time zone 'Europe/Amsterdam'),
    (proj_id, 'in_behandeling',     null,                   admin_uid, ((vandaag - 4)  + time '11:00') at time zone 'Europe/Amsterdam');

  -- ---------- 7. opmerkingen ----------
  delete from public.project_remarks where project_id = proj_id;
  insert into public.project_remarks (project_id, body, visible_to_customer, created_by, created_at) values
    (proj_id,
     $t$Je Valhalla is binnen. Bij de intake hebben we de lak onder de inspectielampen bekeken: nagenoeg nieuwstaat, alleen een paar lichte haarkrasjes op de achterklep. Die polijsten we weg met het Perfection Package, voordat de folie erop gaat.$t$,
     true, admin_uid, ((vandaag - 4) + time '10:15') at time zone 'Europe/Amsterdam'),
    (proj_id,
     $t$Klant haalt de auto zelf op. Plan een uur in voor de uitleg over onderhoud en geef de wasinstructies mee.$t$,
     false, admin_uid, ((vandaag - 3) + time '09:00') at time zone 'Europe/Amsterdam'),
    (proj_id,
     $t$Wassen, decontamineren en polijsten zijn klaar. We hebben de emblemen en de achterlichten gedemonteerd, zodat we de folie straks rondom de randen kunnen omslaan.$t$,
     true, admin_uid, ((vandaag - 3) + time '16:40') at time zone 'Europe/Amsterdam'),
    (proj_id,
     $t$De voorkant, de motorkap en de voorschermen zitten in de folie. Morgen gaan we verder met de portieren en de dorpels.$t$,
     true, admin_uid, ((vandaag - 1) + time '17:20') at time zone 'Europe/Amsterdam');

  -- ---------- 8. meerwerk ----------
  -- twee opties uit de offerte die toen niet gekozen zijn: één inmiddels
  -- geaccepteerd, één die nog op antwoord wacht (daar kan de bezoeker op klikken)
  delete from public.extra_work where project_id = proj_id;
  insert into public.extra_work
    (project_id, title, description, price, estimated_hours, pricing_mode, status, created_by, decided_at, created_at)
  values
    (proj_id, 'PPF Instaplijsten',
     'Folie op de instaplijsten, tegen krassen bij het in- en uitstappen.',
     100.00, 1.0, 'totaal', 'klant_akkoord', admin_uid,
     ((vandaag - 4) + time '14:10') at time zone 'Europe/Amsterdam',
     ((vandaag - 4) + time '10:30') at time zone 'Europe/Amsterdam'),
    (proj_id, 'Modesta leercoating',
     'Lederbescherming tegen vlekken en slijtage. Nu de Valhalla toch binnen staat, kunnen we het interieur meteen meenemen.',
     235.00, 2.0, 'totaal', 'voorgesteld', admin_uid,
     null,
     ((vandaag - 1) + time '17:25') at time zone 'Europe/Amsterdam');

  -- ---------- 9. documenten & links ----------
  -- de wasinstructies als link naar de voorbeeld-PDF (geen upload nodig)
  delete from public.project_documents
   where project_id = proj_id and storage_path like '/voorbeeld/%';
  insert into public.project_documents (project_id, type, name, storage_path, uploaded_by, created_at)
  values (proj_id, 'overig', 'Wasinstructies PPF en coating', '/voorbeeld/wasinstructies-voorbeeld.pdf',
          admin_uid, ((vandaag - 4) + time '11:05') at time zone 'Europe/Amsterdam');

  -- ---------- 10. foto's van het echte project ----------
  -- Zelfde bestand, eigen rij: de klant mag een foto zien zodra er een rij in
  -- zijn eigen project naar wijst. Alleen foto's die ook de echte klant mag zien.
  if src_proj is not null then
    delete from public.project_photos
     where project_id = proj_id
       and storage_path in (select storage_path from public.project_photos where project_id = src_proj);
    insert into public.project_photos (project_id, storage_path, label, caption, visible_to_customer, uploaded_by, created_at)
    select proj_id, storage_path, label, caption, true, uploaded_by, created_at
      from public.project_photos
     where project_id = src_proj and visible_to_customer;
  end if;

  -- ---------- 11. uren (alleen zichtbaar in admin) ----------
  delete from public.work_logs where project_id = proj_id;
  insert into public.work_logs (project_id, employee_id, log_date, work_type, hours, description)
  select proj_id, w.emp, w.d, w.t::work_type, w.h, w.omschrijving
  from (values
    (coalesce(mw1, admin_uid), vandaag - 4, 'inspectie',   1.5, 'Intake en lakinspectie met de klant'),
    (coalesce(mw1, admin_uid), vandaag - 3, 'wassen',      3.0, 'Handwas en decontamineren'),
    (coalesce(mw1, admin_uid), vandaag - 3, 'polijsten',   4.5, 'Perfection Package: haarkrasjes achterklep'),
    (coalesce(mw2, admin_uid), vandaag - 2, 'ppf_montage', 7.5, 'Emblemen en achterlichten demonteren, PPF voorzijde'),
    (coalesce(mw1, admin_uid), vandaag - 1, 'ppf_montage', 8.0, 'PPF motorkap en voorschermen')
  ) as w(emp, d, t, h, omschrijving);

  raise notice 'Demo-dossier klaar: project %, gebaseerd op %', proj_id, coalesce(src_proj::text, 'standaardgegevens');
end $$;

-- Ter controle: het project, het account en hoeveel foto's er zijn overgenomen.
select p.id as project_id, p.title, p.status, p.published_at is not null as gepubliceerd,
       (select count(*) from public.project_photos f where f.project_id = p.id) as fotos,
       u.email as inloggen_met
  from public.projects p
  join public.customers c on c.id = p.customer_id
  join auth.users u on u.id = c.profile_id
 where u.email = 'demo@jurgh.test';

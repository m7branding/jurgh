-- ============================================================
-- Eenmalige import: de drie laatst gewonnen Offorte-offertes
--
-- Draai dit NA migratie 0008 (of na full_setup.sql).
-- Veilig opnieuw te draaien: een offerte die er al in staat wordt
-- overgeslagen op offorte_proposal_id.
--
-- TESTFASE: de klanten krijgen een onbezorgbaar @jurgh.invalid adres en
-- herinneringen staan uit, zodat er niets naar de echte klant kan gaan.
-- Het echte e-mailadres blijft in Offorte staan.
-- ============================================================

-- ------------------------------------------------------------
-- Jurgh-Offerte 959 — Porsche Cayenne Turbo s
-- klant: Stefan Ottenbros (0653974122)
-- auto : geen kenteken in de offerte
-- ------------------------------------------------------------
do $$
declare
  cust uuid;
  veh  uuid;
  adm  uuid;
begin
  if exists (select 1 from public.projects where offorte_proposal_id = 395679) then
    raise notice 'Offerte 395679 staat er al in, overgeslagen';
    return;
  end if;

  select id into adm from public.profiles where role = 'admin' order by created_at limit 1;

  select id into cust from public.customers where offorte_contact_id = 290259;
  if cust is null then
    insert into public.customers (name, email, phone, is_business, company_name, offorte_contact_id, reminders_enabled)
    values ($jurgh$Stefan Ottenbros$jurgh$, $jurgh$offorte-290259@jurgh.invalid$jurgh$, $jurgh$0653974122$jurgh$, false, null, 290259, false)
    returning id into cust;
  end if;

  insert into public.vehicles (customer_id, license_plate, make, model, year, color)
  values (cust, null, null, null, null, null)
  returning id into veh;

  insert into public.projects (
    customer_id, vehicle_id, title, type, status, price,
    loaner_car, transport, internal_notes,
    offorte_proposal_id, offorte_proposal_nr, offorte_proposal_url, created_by
  ) values (
    cust, veh, $jurgh$Porsche Cayenne Turbo s$jurgh$, $jurgh$detailing$jurgh$, 'goedgekeurd', 4915,
    false, false, $jurgh$Automatisch aangemaakt uit Offorte (Jurgh-Offerte 959). Geaccordeerd op 2026-09-28. Kenteken stond niet in de offerte — auto nog aanvullen. 
Geaccepteerde regels:
• Business class detailing met dubbele laag glascaoting — € 2250.00
• Modesta leercoating — € 235.00
• Ramen tinten voorzijde (5 stuks) — € 600.00
• Uitdeuken motorkap — € 150.00
• Intippen steenslag (max 80% resultaat) — € 150.00
• PPF Deurkommen (4st) — € 120.00
• PPF Bagage tilrand — € 150.00
• PPF Instaplijsten — € 160.00
• PPF B&C stylen — € 300.00
• Velgherstel-uw velgen weer als nieuw! (4×) — € 800.00$jurgh$,
    395679, $jurgh$Jurgh-Offerte 959$jurgh$, $jurgh$https://offerte.detailing.nl/viewer/395679/pp/boqDKkUiIC323876$jurgh$, adm
  );
end $$;

-- ------------------------------------------------------------
-- Jurgh-Offerte 898 — Mercedes G63
-- klant: Rens van den Berg (0624336688)
-- auto : geen kenteken in de offerte
-- ------------------------------------------------------------
do $$
declare
  cust uuid;
  veh  uuid;
  adm  uuid;
begin
  if exists (select 1 from public.projects where offorte_proposal_id = 383247) then
    raise notice 'Offerte 383247 staat er al in, overgeslagen';
    return;
  end if;

  select id into adm from public.profiles where role = 'admin' order by created_at limit 1;

  select id into cust from public.customers where offorte_contact_id = 239929;
  if cust is null then
    insert into public.customers (name, email, phone, is_business, company_name, offorte_contact_id, reminders_enabled)
    values ($jurgh$Rens van den Berg$jurgh$, $jurgh$offorte-239929@jurgh.invalid$jurgh$, $jurgh$0624336688$jurgh$, false, null, 239929, false)
    returning id into cust;
  end if;

  insert into public.vehicles (customer_id, license_plate, make, model, year, color)
  values (cust, null, null, null, null, null)
  returning id into veh;

  insert into public.projects (
    customer_id, vehicle_id, title, type, status, price,
    loaner_car, transport, internal_notes,
    offorte_proposal_id, offorte_proposal_nr, offorte_proposal_url, created_by
  ) values (
    cust, veh, $jurgh$Mercedes G63$jurgh$, $jurgh$ppf$jurgh$, 'goedgekeurd', 1480,
    false, false, $jurgh$Automatisch aangemaakt uit Offorte (Jurgh-Offerte 898). Geaccordeerd op 2026-09-28. Kenteken stond niet in de offerte — auto nog aanvullen. 
Geaccepteerde regels:
• Set-up kosten (aanname, wassen, polijsten etc) — € 275.00
• Oude PPF verwijderen — € 225.00
• Voorbumper PPF — € 595.00
• Wielkastrand PPF (let op, ca 1 maand uitharden na spuitwerk) — € 195.00
• Coating over voorbumper en wielkastrand (2×) — € 190.00$jurgh$,
    383247, $jurgh$Jurgh-Offerte 898$jurgh$, $jurgh$https://offerte.detailing.nl/viewer/383247/pp/kppoosubDC277146$jurgh$, adm
  );
end $$;

-- ------------------------------------------------------------
-- Jurgh-Offerte 868 — PPF Silver voor Porsche 911 Targa 4s (KLG-11-S)
-- klant: Jorris van Doorn (0653663846)
-- auto : KLG11S — Porsche 911 Targa 4S (2023, Grijs) via RDW
-- ------------------------------------------------------------
do $$
declare
  cust uuid;
  veh  uuid;
  adm  uuid;
begin
  if exists (select 1 from public.projects where offorte_proposal_id = 376179) then
    raise notice 'Offerte 376179 staat er al in, overgeslagen';
    return;
  end if;

  select id into adm from public.profiles where role = 'admin' order by created_at limit 1;

  select id into cust from public.customers where offorte_contact_id = 279220;
  if cust is null then
    insert into public.customers (name, email, phone, is_business, company_name, offorte_contact_id, reminders_enabled)
    values ($jurgh$Jorris van Doorn$jurgh$, $jurgh$offorte-279220@jurgh.invalid$jurgh$, $jurgh$0653663846$jurgh$, false, null, 279220, false)
    returning id into cust;
  end if;

  select id into veh from public.vehicles where customer_id = cust and license_plate = $jurgh$KLG11S$jurgh$;
  if veh is null then
    insert into public.vehicles (customer_id, license_plate, make, model, year, color)
    values (cust, $jurgh$KLG11S$jurgh$, $jurgh$Porsche$jurgh$, $jurgh$911 Targa 4S$jurgh$, 2023, $jurgh$Grijs$jurgh$)
    returning id into veh;
  end if;

  insert into public.projects (
    customer_id, vehicle_id, title, type, status, price,
    loaner_car, transport, internal_notes,
    offorte_proposal_id, offorte_proposal_nr, offorte_proposal_url, created_by
  ) values (
    cust, veh, $jurgh$PPF Silver voor Porsche 911 Targa 4s (KLG-11-S)$jurgh$, $jurgh$ppf$jurgh$, 'goedgekeurd', 2295,
    false, false, $jurgh$Automatisch aangemaakt uit Offorte (Jurgh-Offerte 868). Geaccordeerd op 2026-09-28. 
Geaccepteerde regels:
• PPF Full Front — € 2295.00$jurgh$,
    376179, $jurgh$Jurgh-Offerte 868$jurgh$, $jurgh$https://offerte.detailing.nl/viewer/376179/pp/CbDgxdgBsC313386$jurgh$, adm
  );
end $$;

-- Klaar. Controleer in het portaal: Admin → Projecten.

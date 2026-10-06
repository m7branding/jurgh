# JURGH Car Detailing — Klantenportaal

Een premium, automotive klantenportaal voor JURGH Car Detailing. Elke auto krijgt
een eigen digitaal dossier (**JURGH Car Dossier / Vehicle Care Passport**) waarin
klanten live de voortgang, foto's en documenten van hun behandeling volgen.

Gebouwd met **Next.js (App Router) + TypeScript + Tailwind CSS** en **Supabase**
(auth, database, storage). Klaar voor deploy op **Netlify**.

---

## Wat zit er in deze eerste testversie (MVP-slice)

Conform de gevraagde eerste testfase:

| Rol | Kan |
| --- | --- |
| **Admin** | Projecten aanmaken (klant + auto koppelen), status bijwerken, foto's uploaden + labelen, bijzonderheden vastleggen, offerte/factuur/certificaat uploaden, project markeren als **compleet** |
| **Medewerker** | Lopende projecten openen, **uren/werkzaamheden loggen**, foto's uploaden, bijzonderheden plaatsen, beperkte statusupdates (auto ontvangen → klaar voor oplevering) |
| **Klant** | Eigen dashboard, dossier per auto inzien: status + voortgang, tijdlijn, zichtbare foto's, bijzonderheden, documenten downloaden, basis rewards-progress |

Rolgebaseerde navigatie, donker premium design, status-badges, progress bars,
tijdlijn, uploadzones en fallback auto-thumbnail zijn aanwezig.

> Latere fases (Offorte/SnelStart-koppeling, WhatsApp, automatische PDF-generatie,
> uitgebreide rapportage, meerwerk-acceptatieflow, shop-koppeling) zijn voorbereid
> in het datamodel maar nog niet gebouwd.

---

## Setup A — Browser-only (aanbevolen, geen lokale tooling)

Je hoeft niets te installeren. Alles gebeurt in de browser via Supabase + Netlify.

### 1. Database + testaccounts klaarzetten (één paste)
1. Ga naar je Supabase project → **SQL Editor** → **New query**.
2. Open `supabase/full_setup.sql` uit deze repo, kopieer de **volledige inhoud**,
   plak in de editor en klik **Run**.

Dat ene bestand zet alles klaar: schema, Row Level Security, storage-buckets én
drie testaccounts mét demo-dossier. Je mag het veilig opnieuw draaien.

> Wil je het stap voor stap? Draai dan in plaats daarvan de losse bestanden in
> volgorde: `migrations/0001_init.sql` → `0002_rls.sql` → `0003_storage.sql` →
> `0004_vehicle_photos.sql` → `0005_extra_work.sql` → `0006_workflow_extensions.sql`
> → `0007_project_types_plate.sql` → `0008_offorte.sql` → `0009_publiceren.sql`
> → `seed.sql`.

Testaccounts (wachtwoord voor alle: `JurghTest123!`):

| E-mail | Rol |
| --- | --- |
| `admin@jurgh.test` | Admin |
| `medewerker@jurgh.test` | Medewerker |
| `klant@jurgh.test` | Klant (met demo-auto + project) |

Daarnaast staan er drie M7 Branding-testaccounts klaar (wachtwoord voor alle: `123123123`):

| E-mail | Rol |
| --- | --- |
| `alexander@m7branding.com` | Admin |
| `alexander_koselka@hotmail.com` | Klant |
| `test@detailing.nl` | Medewerker |

En de medewerkers van JURGH (wachtwoord voor alle: `JurghTest123!`):

| E-mail | Naam |
| --- | --- |
| `duncan@detailing.nl` | Duncan |
| `tijmen@detailing.nl` | Tijmen |
| `hidde@detailing.nl` | Hidde |
| `sem@detailing.nl` | Sem |
| `inta@detailing.nl` | Inta |
| `bram@detailing.nl` | Bram |

> Het adres is het inlogaccount; er hoeft geen postvak achter te zitten zolang jij
> het wachtwoord instelt. Zonder werkende mailbox kan iemand wél nooit zelf zijn
> wachtwoord herstellen.

### 2. App online zetten via Netlify
1. Koppel deze GitHub-repo in Netlify ("Import from Git"). Netlify draait zelf
   `npm install` + `npm run build` (de `@netlify/plugin-nextjs` staat al klaar).
2. Zet onder **Site settings → Environment variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<jouw-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<jouw publishable / anon key>
   ```
   (Te vinden in Supabase → Settings → API. De service-role key is **niet** nodig.)
3. Voeg in Supabase → Authentication → URL Configuration je Netlify-URL toe als
   Site URL / Redirect URL.
4. Open je Netlify-URL en log in — je wordt op basis van je rol automatisch naar
   de juiste omgeving gestuurd.

---

## Setup B — Lokaal draaien (alleen voor ontwikkelen)

### 1. Dependencies installeren
```bash
npm install
```

### 2. Database klaarzetten
Run `supabase/full_setup.sql` in de Supabase SQL Editor (zie Setup A, stap 1).

### 3. Environment variabelen
```bash
cp .env.example .env
```
Vul `NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_ANON_KEY` in.
(`SUPABASE_SERVICE_ROLE_KEY` is alleen nodig als je het Node-seedscript
`supabase/seed.mjs` gebruikt in plaats van de SQL-seed.)

### 4. Starten
```bash
npm run dev
```
Open <http://localhost:3000> en log in.

---

## Testscenario (end-to-end)

1. Log in als **admin** → maak een project aan (of open het demo-project).
2. Werk de status bij, upload een foto (label bv. *Voor behandeling*), leg een
   bijzonderheid vast, upload de getekende offerte.
3. Log in als **medewerker** → open hetzelfde project → log werkzaamheden/uren.
4. Rond het project af als admin (**Project afronden**) en upload de factuur.
5. Log in als **klant** → open het dossier en zie alle vastgelegde handelingen,
   zichtbare foto's, de tijdlijn en de downloadbare documenten.

> Foto's met "Zichtbaar voor klant" uit blijven intern; de klant ziet ze niet.

---

## Deploy op Netlify

1. Push deze repo naar GitHub en koppel hem in Netlify ("Import from Git").
2. Build command `npm run build`, de `@netlify/plugin-nextjs` plugin staat in
   `netlify.toml`.
3. Zet onder **Site settings → Environment variables**:
   `NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   (De service-role key is **niet** nodig op Netlify — alleen lokaal voor de seed.)
4. Voeg in Supabase → Authentication → URL Configuration je Netlify-URL toe.

---

## Offorte-koppeling

Wordt een offerte in Offorte geaccordeerd, dan maakt het portaal automatisch een
project aan. Offorte stuurt daarvoor een `proposal_won`-webhook naar
`/api/offorte/webhook`; het portaal haalt de offerte op en zet om wat erin staat.

### Wat wordt overgenomen

| Uit de offerte | Wordt in het portaal |
| --- | --- |
| Contact (naam, telefoon, KvK/btw) | Klant — gematcht op het Offorte-contact, anders nieuw aangemaakt |
| Offertenaam, bijv. `PPF Gold voor Porsche 911 (KLG-11-S)` | Projecttitel, en het kenteken eruit → RDW-check voor merk, model, bouwjaar en kleur |
| `price_total_original` (subtotaal) | Prijs **excl. btw** |
| Geaccepteerde prijsregels | Projecttype (zwaarste bedrag wint), leenauto, transport, en een samenvatting in de interne notitie |
| Offertenummer + viewer-link | Herkomst op het project, zichtbaar voor admin en medewerker |

Een nieuw project komt binnen op status **Goedgekeurd**. Velden die Offorte niet
levert blijven leeg — er wordt niets verzonnen. Staat er geen kenteken in de
offertenaam, of herkent de RDW het niet, dan krijgt de auto geen kenteken en
meldt de interne notitie dat de auto nog aangevuld moet worden.

Dubbele afleveringen zijn onschadelijk: een project onthoudt zijn
`offorte_proposal_id` en een tweede poging wordt overgeslagen.

### Instellen

1. Zet in Netlify → Site settings → Environment variables (zie `.env.example`):
   `SUPABASE_SERVICE_ROLE_KEY`, `OFFORTE_ACCOUNT`, `OFFORTE_API_KEY`,
   `OFFORTE_WEBHOOK_SECRET` en `OFFORTE_TEST_MODE`.
   De service-role key is hier wél nodig: de webhook heeft geen ingelogde
   gebruiker en moet langs Row Level Security.
2. Registreer de webhook in Offorte:

   ```bash
   curl -X POST https://connect.offorte.com/api/v2/<account>/webhooks \
     -H "Authorization: <api key>" \
     -H "Content-Type: application/json" \
     -d '{"payload_url":"https://<portaal>/api/offorte/webhook?token=<webhook secret>",
          "payload_content_type":"json","events":["proposal_won"],"active":1}'
   ```

3. Controleer of het eindpunt leeft: `GET https://<portaal>/api/offorte/webhook`
   geeft `{"ok":true}`.

Elke aflevering komt in de tabel `offorte_events` te staan (admin leest mee), dus
een mislukte import is terug te vinden zonder in de logs van Netlify te duiken.

### Testfase

Met `OFFORTE_TEST_MODE=true` (de standaard) krijgen klanten uit Offorte een
onbezorgbaar `@jurgh.invalid` adres en staan herinneringen uit, zodat er niets
naar een echte klant kan. Het echte adres blijft in Offorte staan. Het portaal
maakt sowieso géén inlogaccount aan voor deze klanten, dus Supabase verstuurt
ook geen uitnodigings- of bevestigingsmail.

`supabase/import-offorte-laatste-3.sql` haalt eenmalig de drie laatst gewonnen
offertes binnen, met diezelfde dummy-adressen. Veilig opnieuw te draaien.

---

## Publiceren naar de klant

Een project is er voor de werkplaats zodra het binnenkomt; de klant ziet het pas
als een admin het **publiceert**. Dat staat los van de projectstatus: publiceren
kan in elke fase, en intrekken ook, zonder de status aan te raken.

Bij publiceren gebeurt er drie dingen:

1. er komt een klantaccount voor het e-mailadres (bestaat er al een, dan wordt die gebruikt);
2. dat account wordt aan het klantrecord gekoppeld via `customers.profile_id`;
3. `projects.published_at` wordt gezet, waarna Row Level Security het dossier vrijgeeft.

De afscherming zit dus in de database, niet in de UI. `owns_project()` eist
`published_at is not null`, en foto's, bijzonderheden, documenten en meerwerk
lopen allemaal via die functie — die verdwijnen dus mee.

### Inloggen

De klant logt in met een **magic link**: mailadres invullen, mail openen, klikken.
Geen wachtwoord. Let wel: dat is één factor — wie bij de mailbox kan, kan erin.
Echte 2FA zou wachtwoord plus authenticator-app betekenen.

### Testfase: droogloop

Met `PORTAL_MAIL_DRY_RUN=true` (de standaard) wordt er **niets verstuurd**. De
inloglink wordt gegenereerd en bewaard in `portal_invites`, zichtbaar onder
**Admin → Uitnodigingen**, zodat je de hele flow zelf kunt doorlopen. Zo'n link
is een sleutel tot het dossier van die klant; de tabel is daarom alleen voor
admin leesbaar en de link verloopt vanzelf.

Publiceren weigert bij een ontbrekend of `.invalid` adres — de klanten die via
Offorte in de testfase binnenkomen zijn daarmee per definitie onbereikbaar. Wil
je het testen, zet dan op **Admin → Klanten** je eigen adres bij die klant.
Met plus-adressering (`jij+klant1@...`) maak je zoveel testklanten als je wilt.

### Voordat dit live kan

Supabase's ingebouwde mailserver doet **2 berichten per uur** en bezorgt alleen
aan teamleden van het Supabase-project. Er moet dus eigen SMTP ingericht worden
(Supabase → Authentication → SMTP, bijvoorbeeld via Resend) vóór `PORTAL_MAIL_DRY_RUN`
op `false` kan.

---

## Architectuur

```
src/
  app/
    login/                # auth (server action)
    admin/                # admin-omgeving (dashboard, projecten, aanmaken, detail)
    medewerker/           # werkomgeving (projecten, uren loggen)
    klant/                # klantomgeving (dashboard, dossier)
    actions/projects.ts   # server actions: status, foto, document, uren, bijzonderheden
  components/             # UI, PortalShell, ProjectCard, ProjectDetail, forms
  lib/
    supabase/             # browser/server/middleware clients (@supabase/ssr)
    auth.ts               # rol-helpers
    constants.ts          # labels (statussen, types, werkzaamheden)
    data.ts               # data-fetching + signed storage URLs
    app/api/offorte/      # webhook-eindpunt voor geaccordeerde offertes
  lib/
    offorte.ts            # Offorte API-client + vertaling offerte → project
    offorte-import.ts     # offerte binnenhalen als klant/auto/project
    rdw.ts                # kentekencheck (open data RDW)
supabase/
  migrations/             # 0001 schema · 0002 RLS · 0003 storage · … · 0009 publiceren
  seed.mjs                # testaccounts + demo-dossier
```

Beveiliging draait op **Supabase Row Level Security**: staff (admin/medewerker)
ziet alles; een klant ziet uitsluitend zijn eigen klant/auto/projecten en alleen
foto's die expliciet zichtbaar zijn gemaakt. Storage-buckets zijn privé; bestanden
worden via tijdelijke signed URLs geserveerd.

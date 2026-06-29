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

## Lokaal draaien

### 1. Dependencies installeren
```bash
npm install
```

### 2. Supabase project klaarzetten
1. Maak (of gebruik) een project op [supabase.com](https://supabase.com).
2. Open de **SQL Editor** en draai de migraties uit `supabase/migrations/` in volgorde:
   - `0001_init.sql` (schema + triggers)
   - `0002_rls.sql` (row level security)
   - `0003_storage.sql` (storage buckets + policies)

### 3. Environment variabelen
Kopieer `.env.example` naar `.env` en vul in (Supabase → Settings → API):
```bash
cp .env.example .env
```
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # alleen voor het seed-script
```

### 4. Testaccounts + demo-dossier aanmaken
```bash
node supabase/seed.mjs
```
Dit maakt drie accounts (wachtwoord voor alle: `JurghTest123!`):

| E-mail | Rol |
| --- | --- |
| `admin@jurgh.test` | Admin |
| `medewerker@jurgh.test` | Medewerker |
| `klant@jurgh.test` | Klant (met demo-auto + project) |

### 5. Starten
```bash
npm run dev
```
Open <http://localhost:3000> en log in. Je wordt automatisch naar de juiste
omgeving gestuurd op basis van je rol.

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
supabase/
  migrations/             # 0001 schema · 0002 RLS · 0003 storage
  seed.mjs                # testaccounts + demo-dossier
```

Beveiliging draait op **Supabase Row Level Security**: staff (admin/medewerker)
ziet alles; een klant ziet uitsluitend zijn eigen klant/auto/projecten en alleen
foto's die expliciet zichtbaar zijn gemaakt. Storage-buckets zijn privé; bestanden
worden via tijdelijke signed URLs geserveerd.

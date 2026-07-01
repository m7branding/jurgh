# M7 — Online Experience

Een **next-level, interactieve service-catalogus** waarmee klanten zelf hun
dienstverlening samenstellen. Dark M7-huisstijl met geanimeerd sterren-/pixelveld,
lichte gradients, abstracte iconen en pill-CTA's met de M7-signatuur (circulaire
teal pijl).

Gebouwd met **Next.js (App Router) + TypeScript**. Geen database of externe
dependencies nodig — volledig self-contained en klaar om te hosten of te embedden.

## Wat zit erin

Een intake-flow (_waar sta je nu?_ + _wat wil je bereiken?_) die een genummerd,
aanbevolen pad door de catalogus uitzet, met conditionele cross-sell. Categorieën:

- **Branding** — nieuwe/rebranding/co-branding, volledig brandbook, logo-export,
  e-mailhandtekening, 3D mock-ups, illustraties
- **Print** — visitekaartjes, flyers, brochures, promo, uitnodigingen
- **Websites** — WordPress/Webflow builds, CMS met custom velden, content-model,
  styleframing, animaties/Lottie, AI-beeld, dynamische blokken & pop-ups, migratie
- **Webshops** — WooCommerce/Shopify, EU-VAT, custom checkout, PDF-facturen
- **Web-apps & portalen** — klant-/offerte-/loyaliteitsportalen, Stripe, automations
- **Apps** — UI/UX, kanban/sprintmanagement, testing, ontwikkeling
- **Organisch** — posts, reels, AI-renders (schets→beeld), AI-animaties, video, podcast
- **Paid Ads** — Meta/LinkedIn/Reddit/TikTok, account-inrichting, strategie
- **SEO / AEO** — content, optimalisatie, linkbuilding, JSON-LD, GEO/AI-answers
- **Tracking** — GA4/server-side, dashboards, cookie-consent & compliance
- **Funnels** — configuratoren, offerte-flows, opt-ins, e-mailreeksen, audience-sync
- **CRM & Integraties** — Odoo/HubSpot/Pipedrive/Teamleader/Notion, custom API's
- **Hosting** & **Support** — webhosting en webplans

Live totalen (indicatieve vanafprijzen: eenmalig + doorlopend), gegroepeerde
samenvatting en offerte-/kennismakingsaanvraag via e-mail.

## Lokaal draaien

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Bouwen / deployen

```bash
npm run build && npm run start
```

Deploybaar op Vercel, Netlify of elke Node-host. Voor een **statische export**
(handig om te embedden op WordPress/Webflow of via een CDN te hosten): zet
`output: "export"` aan in `next.config.js` en gebruik `npm run build`.

## Structuur

```
src/
  app/
    layout.tsx        # root layout (Poppins) + globals
    page.tsx          # rendert de experience
    globals.css       # globale basis
    experience.css    # M7-huisstijl + alle experience-styling
  components/experience/
    Configurator.tsx  # de interactieve configurator (client)
    Starfield.tsx     # geanimeerd sterren-/pixel-canvas
    CategoryIcon.tsx  # abstracte iconen per categorie
  lib/
    catalog.ts        # catalogus-data, intake, prijzen & aanbevelingslogica
```

## Aanpassen

- **Diensten & prijzen**: `src/lib/catalog.ts` (alle categorieën, pakketten,
  opties, doelen en cross-sell-regels op één plek).
- **Huisstijl**: de kleur-tokens bovenin `src/app/experience.css` (`--exp-a1`
  teal, `--exp-gold`, `--exp-green`, enz.).
- **Contact**: het e-mailadres staat in `Configurator.tsx` (`INTRO_MAILTO`) en de
  offerte-submit.

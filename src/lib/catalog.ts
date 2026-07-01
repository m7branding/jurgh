// ============================================================
// M7 — Service Catalogus (data + intake + aanbevelingslogica)
// Klanten stellen hier zelf een dienstverlening samen. We starten
// met een korte intake (waar sta je / wat wil je bereiken) en leiden
// ze via een genummerd pad + conditionele cross-sell door de catalogus.
// Alle prijzen zijn INDICATIEVE VANAFPRIJZEN.
// ============================================================

export type IconKey =
  | "branding"
  | "print"
  | "websites"
  | "webshop"
  | "webapps"
  | "apps"
  | "organic"
  | "paid"
  | "seo"
  | "tracking"
  | "funnels"
  | "crm"
  | "hosting"
  | "support";

export type Price = {
  /** Eenmalige (setup) kosten in euro — indicatief vanaf. */
  setup?: number;
  /** Doorlopende kosten per maand in euro. */
  monthly?: number;
  /** true = op aanvraag / maatwerk. */
  custom?: boolean;
  /** "stuk"/"afl." toont een eenheid. */
  suffix?: string;
};

export type PkgKind = "plan" | "addon" | "item";

export type Pkg = {
  id: string;
  name: string;
  tagline: string;
  kind: PkgKind;
  price: Price;
  features: string[];
  highlight?: boolean;
  badge?: string;
  recommends?: IconKey[];
};

export type CategoryOption = {
  id: string;
  label: string;
  choices: string[];
  multi?: boolean;
  triggers?: Record<string, IconKey>;
};

export type Category = {
  id: IconKey;
  label: string;
  kicker: string;
  blurb: string;
  note?: string;
  options?: CategoryOption[];
  packages: Pkg[];
};

// ------------------------------------------------------------
// Intake — doelen & startpunt
// ------------------------------------------------------------

export type Goal = {
  id: string;
  label: string;
  emoji: string;
  targets: IconKey[]; // categorieën die bij dit doel horen (in volgorde)
};

export const GOALS: Goal[] = [
  { id: "brand", label: "Sterk merk / identiteit", emoji: "✦", targets: ["branding", "print"] },
  { id: "website", label: "Nieuwe website", emoji: "◈", targets: ["websites", "hosting", "support", "seo"] },
  { id: "shop", label: "Webshop starten", emoji: "◑", targets: ["webshop", "tracking", "hosting", "support"] },
  { id: "leads", label: "Meer leads & funnels", emoji: "⟿", targets: ["funnels", "paid", "tracking"] },
  { id: "findable", label: "Beter vindbaar (SEO/AEO)", emoji: "◎", targets: ["seo", "tracking"] },
  { id: "ads", label: "Betaald adverteren", emoji: "◉", targets: ["paid", "tracking"] },
  { id: "portal", label: "Web-app / portaal", emoji: "▤", targets: ["webapps", "hosting", "support", "crm"] },
  { id: "app", label: "Mobiele app", emoji: "▢", targets: ["apps", "webapps"] },
  { id: "content", label: "Meer content", emoji: "❋", targets: ["organic", "seo"] },
  { id: "run", label: "Onderhoud & hosting", emoji: "◍", targets: ["hosting", "support"] },
];

export type Stage = {
  id: string;
  label: string;
  desc: string;
  boost: IconKey[]; // extra categorieën die bij dit startpunt logisch zijn
};

export const STAGES: Stage[] = [
  { id: "startup", label: "Nieuw / startup", desc: "We beginnen bij nul.", boost: ["branding", "websites"] },
  { id: "existing", label: "Bestaand bedrijf", desc: "We bouwen voort op wat er is.", boost: [] },
  { id: "rebrand", label: "Rebranding", desc: "Tijd voor een frisse identiteit.", boost: ["branding", "websites"] },
  { id: "migrate", label: "Platform-migratie", desc: "Overstappen zonder ranking-verlies.", boost: ["websites", "seo", "hosting"] },
  { id: "scale", label: "Opschalen", desc: "Meer bereik, meer omzet.", boost: ["paid", "funnels", "tracking"] },
];

// ------------------------------------------------------------
// CATALOG — volgorde = natuurlijke journey (identity → build → grow → run)
// ------------------------------------------------------------

export const CATALOG: Category[] = [
  // ========================================================== BRANDING
  {
    id: "branding",
    label: "Branding",
    kicker: "Identiteit & strategie",
    blurb:
      "Van nieuwe startup-brand tot rebranding of co-branding. Een compleet brandbook: naming, positionering, kleur, typografie, iconografie, tone of voice, archetype, patterns en communication guide.",
    note: "Indicatieve vanafprijzen — scope en aantal iteraties bepalen de definitieve offerte.",
    packages: [
      {
        id: "brand-essentials",
        name: "Brand Essentials",
        tagline: "Een solide basis om mee te starten.",
        kind: "plan",
        price: { setup: 1500 },
        features: ["Logo + varianten", "Kleurenpalet & typografie", "Basis-richtlijnen", "Logo export-package"],
        recommends: ["print", "websites"],
      },
      {
        id: "brand-startup",
        name: "Startup Brand",
        tagline: "Volledig nieuwe merkidentiteit.",
        kind: "plan",
        price: { setup: 3500 },
        highlight: true,
        badge: "Populair",
        features: [
          "Naming & positionering",
          "Logo & visuele identiteit",
          "Kleur, typografie & iconografie",
          "Tone of voice & merk-archetype",
          "Brand patterns & assets",
          "Brandbook + communication guide",
        ],
        recommends: ["print", "websites", "organic"],
      },
      {
        id: "brand-rebrand",
        name: "Rebranding / Co-branding",
        tagline: "Bestaande brand naar next level.",
        kind: "plan",
        price: { setup: 4500 },
        features: [
          "Merk-audit & strategie",
          "Herpositionering",
          "Vernieuwde identiteit",
          "Co-branding mogelijk",
          "Migratiegids voor je team",
          "Volledig brandbook",
        ],
        recommends: ["print", "websites"],
      },
      {
        id: "brand-book-plus",
        name: "Brandbook+",
        tagline: "Strategische verdieping.",
        kind: "addon",
        price: { setup: 950 },
        features: ["Strategische positionering", "Tone of voice", "Merk-archetype", "Mock-ups van uitingen"],
      },
      {
        id: "brand-mockups",
        name: "3D mock-ups",
        tagline: "Gelikte 3D-weergaves.",
        kind: "item",
        price: { setup: 475 },
        features: ["Devices, print & merch", "Fotorealistische render", "Voor presentatie & social"],
      },
      {
        id: "brand-illustration",
        name: "Maatwerk illustraties",
        tagline: "Vector-illustraties op maat.",
        kind: "item",
        price: { setup: 675, suffix: "set" },
        features: ["5 custom vector-illustraties", "Schematische visuals", "Voor web & app"],
      },
      {
        id: "brand-logo-export",
        name: "Logo export-package",
        tagline: "Alle formats, klaar voor gebruik.",
        kind: "addon",
        price: { setup: 275 },
        features: ["SVG / PNG / EPS / PDF", "Kleur, mono & inverse", "Favicon & app-icon"],
      },
      {
        id: "brand-email-sig",
        name: "E-mailhandtekening",
        tagline: "Professioneel tot in de mail.",
        kind: "addon",
        price: { setup: 275 },
        features: ["Aansprekend ontwerp", "HTML-implementatie", "Per teamlid uitrolbaar"],
      },
    ],
  },

  // ========================================================== PRINT
  {
    id: "print",
    label: "Print",
    kicker: "Drukwerk & materiaal",
    blurb:
      "Tastbaar en op-merk: visitekaartjes, flyers, informatiebrochures, promotioneel materiaal en uitnodigingen — volledig in je brand identity.",
    note: "Prijzen zijn voor ontwerp; drukwerk (productie) rekenen we op basis van oplage na.",
    packages: [
      {
        id: "print-cards",
        name: "Visitekaartjes",
        tagline: "Eerste indruk in je hand.",
        kind: "item",
        price: { setup: 275 },
        features: ["Ontwerp in je huisstijl", "Dubbelzijdig", "Drukklaar aangeleverd"],
        recommends: ["branding"],
      },
      {
        id: "print-flyer",
        name: "Flyer-ontwerp",
        tagline: "Compacte boodschap, groot effect.",
        kind: "item",
        price: { setup: 275 },
        features: ["Enkel- of dubbelzijdig", "Op-merk vormgeving", "Drukklaar bestand"],
        recommends: ["branding"],
      },
      {
        id: "print-brochure",
        name: "Informatiebrochure",
        tagline: "Je verhaal in stijl.",
        kind: "item",
        price: { setup: 950 },
        features: ["16–20 pagina's", "Diensten, historie & werkproces", "Print-ready opmaak"],
        recommends: ["branding"],
      },
      {
        id: "print-promo",
        name: "Promotioneel materiaal",
        tagline: "Banners, posters & merch.",
        kind: "item",
        price: { setup: 350 },
        features: ["Roll-ups, posters, banners", "Merchandise-ontwerp", "Consistente merkstijl"],
      },
      {
        id: "print-invite",
        name: "Uitnodigingen",
        tagline: "Voor events & lanceringen.",
        kind: "item",
        price: { setup: 250 },
        features: ["Digitaal of print", "Op-merk ontwerp", "Optioneel met RSVP-flow"],
      },
    ],
  },

  // ========================================================== WEBSITES
  {
    id: "websites",
    label: "Websites",
    kicker: "WordPress & Webflow",
    blurb:
      "Next-level design is altijd inbegrepen. Complete builds op WordPress of Webflow — met content-model, CMS met custom velden zodat je zelf beheert, basis-SEO, accessibility en een eerste content-draft.",
    note: "Indicatieve vanafprijzen — de scope (pagina's, interacties, content) bepaalt de definitieve offerte.",
    options: [
      {
        id: "web-platform",
        label: "Platform",
        choices: ["WordPress", "Webflow"],
      },
      {
        id: "web-scope",
        label: "Scope",
        choices: ["Styleframing", "Design", "Design + development"],
        triggers: { Styleframing: "branding" },
      },
    ],
    packages: [
      {
        id: "web-essential",
        name: "Website Essential",
        tagline: "Compacte site, groot effect.",
        kind: "plan",
        price: { setup: 3500 },
        features: [
          "Tot 5 pagina's",
          "Next-level design inbegrepen",
          "CMS met custom velden",
          "Basis-SEO & accessibility",
          "Eerste content-draft",
          "Responsive & razendsnel",
        ],
        recommends: ["hosting", "support", "seo", "branding"],
      },
      {
        id: "web-pro",
        name: "Website Pro",
        tagline: "Volwaardige site met content-model.",
        kind: "plan",
        price: { setup: 6500 },
        highlight: true,
        badge: "Populair",
        features: [
          "Tot 12 pagina's",
          "Content-model & strategie",
          "Sitemap & URL-schema",
          "Scroll / hover / load-interacties",
          "Animated fullscreen menu",
          "CMS-training & go-live support",
        ],
        recommends: ["hosting", "support", "seo", "tracking", "funnels"],
      },
      {
        id: "web-premium",
        name: "Website Premium",
        tagline: "Maatwerk met alles erop.",
        kind: "plan",
        price: { setup: 12000, custom: true },
        features: [
          "Onbeperkt schaalbaar",
          "Sector- / doelgroeppagina's (dynamisch)",
          "Lottie & scroll-animaties",
          "AI-infographics & hero-video",
          "Dynamische landingsblokken",
          "Styleframing-fase inbegrepen",
        ],
        recommends: ["hosting", "support", "seo", "tracking", "funnels", "crm"],
      },
      {
        id: "web-styleframing",
        name: "Styleframing-fase (Figma)",
        tagline: "Vergelijk stijlen vóór de build.",
        kind: "addon",
        price: { setup: 950 },
        features: ["Meerdere richtingen in Figma", "Snel schakelen op stijl", "Zekerheid vóór development"],
      },
      {
        id: "web-content",
        name: "Content op alle pagina's",
        tagline: "Wij schrijven de eerste versie.",
        kind: "addon",
        price: { setup: 1250 },
        features: ["Volledige eerste content-draft", "SEO-bewust geschreven", "Klaar ter review"],
        recommends: ["seo"],
      },
      {
        id: "web-animations",
        name: "Next-level animaties & interacties",
        tagline: "Scroll, load, hover & Lottie.",
        kind: "addon",
        price: { setup: 1500 },
        features: ["Scroll/load/hover-interacties", "Lottie-animaties on scroll", "Animated fullscreen menu"],
      },
      {
        id: "web-media",
        name: "Custom infographics & AI-beeld",
        tagline: "Statisch beeld tot hero-video.",
        kind: "addon",
        price: { setup: 950 },
        features: ["Custom infographics", "AI-gegenereerde afbeeldingen", "Hero-video / bewegend beeld"],
        recommends: ["organic"],
      },
      {
        id: "web-landingblocks",
        name: "Dynamische landingsblokken",
        tagline: "Klant bouwt zelf landingspagina's.",
        kind: "addon",
        price: { setup: 850 },
        features: ["Herbruikbare content-blokken", "Zelf pagina's samenstellen", "Consistente styling"],
      },
      {
        id: "web-popups",
        name: "Dynamische pop-ups",
        tagline: "Engagement met een knipoog.",
        kind: "addon",
        price: { setup: 450 },
        features: ["Klant bepaalt inhoud & zichtbaarheid", "Per pagina instelbaar", "Optioneel confetti / animatie"],
        recommends: ["funnels"],
      },
      {
        id: "web-contentmodel",
        name: "Content-model & strategie",
        tagline: "Sitemap → CMS → URL-schema.",
        kind: "addon",
        price: { setup: 1200 },
        features: ["Sitemap & informatie-architectuur", "Dynamische content bepalen", "Sector-/doelgroeppagina's"],
        recommends: ["seo"],
      },
      {
        id: "web-migration",
        name: "Migratie & 301-redirects",
        tagline: "Overstappen zonder ranking-verlies.",
        kind: "addon",
        price: { setup: 750 },
        features: ["Analyse bij platform-wissel", "Volledig 301-redirectplan", "Behoud van indexatie"],
        recommends: ["seo", "hosting"],
      },
      {
        id: "web-golive",
        name: "Go-live support & CMS-training",
        tagline: "Zelf verder kunnen na livegang.",
        kind: "addon",
        price: { setup: 450 },
        features: ["Persoonlijke CMS-training", "Go-live begeleiding", "Staging-omgeving indien gewenst"],
        recommends: ["support"],
      },
    ],
  },

  // ========================================================== WEBSHOP
  {
    id: "webshop",
    label: "Webshops",
    kicker: "WooCommerce & Shopify",
    blurb:
      "Conversiegerichte shops op WooCommerce of Shopify. Van slimme categoriestructuur en product-pagina's tot EU-VAT-controle, custom checkout, PDF-facturen, vendor-pricing en kortingscodes.",
    note: "Indicatieve vanafprijzen — aantal producten en maatwerk bepalen de definitieve offerte.",
    options: [
      {
        id: "shop-platform",
        label: "Platform",
        choices: ["WooCommerce", "Shopify"],
      },
    ],
    packages: [
      {
        id: "shop-start",
        name: "Shop Starter",
        tagline: "Snel en conversiegericht live.",
        kind: "plan",
        price: { setup: 4500 },
        features: [
          "Tot 50 producten",
          "Conversiegerichte productpagina's",
          "Slimme categoriestructuur",
          "Betaalmethodes & verzending",
          "Basis-SEO",
        ],
        recommends: ["tracking", "seo", "hosting", "support"],
      },
      {
        id: "shop-pro",
        name: "Shop Pro",
        tagline: "Alles technisch op orde.",
        kind: "plan",
        price: { setup: 8500 },
        highlight: true,
        badge: "Populair",
        features: [
          "Onbeperkt producten",
          "EU-VAT-controle",
          "Geavanceerde custom checkout",
          "Kortingscodes & campagnes",
          "Custom PDF-facturen",
          "Vendor-based pricing",
        ],
        recommends: ["tracking", "seo", "funnels", "hosting", "support"],
      },
      {
        id: "shop-scale",
        name: "Shop Scale",
        tagline: "Marktplaats & internationaal.",
        kind: "plan",
        price: { setup: 15000, custom: true },
        features: [
          "Multi-vendor / marktplaats",
          "Headless / performance-build",
          "ERP- / PIM-integraties",
          "Multi-currency & internationaal",
        ],
        recommends: ["tracking", "crm", "hosting", "support"],
      },
    ],
  },

  // ========================================================== WEB-APPS
  {
    id: "webapps",
    label: "Web-apps & portalen",
    kicker: "Custom branded platforms",
    blurb:
      "Klantportalen, offerte- en reserveringsportalen, loyaliteits- en CRM-achtige systemen — volledig custom branded. Met rollen & rechten, gated content, Stripe-checkouts en automations (WhatsApp/e-mail).",
    note: "Automations, meldingen en integraties naar wens — grotendeels maatwerk.",
    packages: [
      {
        id: "wapp-portal",
        name: "Klantportaal",
        tagline: "Eigen omgeving voor je klanten.",
        kind: "plan",
        price: { setup: 6500 },
        features: [
          "Custom branded portaal",
          "Rollen- & rechtenbeheer",
          "Content-gating (lagen)",
          "E-mail / WhatsApp-meldingen",
        ],
        recommends: ["hosting", "support", "crm"],
      },
      {
        id: "wapp-flow",
        name: "Offerte- / reserveringsportaal",
        tagline: "Afspraken & offertes geautomatiseerd.",
        kind: "plan",
        price: { setup: 8500 },
        highlight: true,
        badge: "Populair",
        features: [
          "Offerte- of afspraakflows",
          "Stripe-checkouts",
          "Automations via Make",
          "Dashboard & beheer",
        ],
        recommends: ["hosting", "support", "crm", "funnels", "tracking"],
      },
      {
        id: "wapp-loyalty",
        name: "Loyaliteits- / CRM-portaal",
        tagline: "Punten sparen & klantbinding.",
        kind: "plan",
        price: { setup: 12000, custom: true },
        features: [
          "Punten- & spaarsysteem",
          "CRM-achtige functionaliteit",
          "Segmentatie & automations",
          "Volledig maatwerk",
        ],
        recommends: ["hosting", "support", "crm", "funnels"],
      },
    ],
  },

  // ========================================================== APPS
  {
    id: "apps",
    label: "Apps",
    kicker: "iOS & Android",
    blurb:
      "Alles rondom mobiele apps: UX-research en UI-design in Figma, prototyping en testing, roadmap- en sprintmanagement met kanban, prijsstrategie-advies en volledige ontwikkeling tot in de stores.",
    note: "Ontwikkeling is maatwerk — scope, roadmap en prijs bepalen we samen met jou.",
    packages: [
      {
        id: "mob-strategy",
        name: "App-strategie & advies",
        tagline: "Van idee naar haalbaar plan.",
        kind: "plan",
        price: { setup: 1500 },
        features: ["Concept & scope", "Technische haalbaarheid", "Prijsstrategie-advies", "Roadmap met klant"],
        recommends: ["webapps"],
      },
      {
        id: "mob-uiux",
        name: "App UI/UX-design",
        tagline: "Doordacht ontwerp dat werkt.",
        kind: "plan",
        price: { setup: 4500 },
        highlight: true,
        badge: "Populair",
        features: [
          "UX-research & user flows",
          "UI-design in Figma",
          "Interactief prototype & testing",
          "Design system",
        ],
        recommends: ["webapps"],
      },
      {
        id: "mob-build",
        name: "App-ontwikkeling",
        tagline: "Van build tot in de store.",
        kind: "plan",
        price: { setup: 18000, custom: true },
        features: [
          "iOS & Android",
          "Kanban-board & sprintmanagement in Figma",
          "Testing & QA",
          "App Store-publicatie",
          "Roadmap- & strategiebeheer",
        ],
        recommends: ["webapps", "support", "crm"],
      },
    ],
  },

  // ========================================================== ORGANISCHE MARKETING
  {
    id: "organic",
    label: "Organisch",
    kicker: "Marketing · content",
    blurb:
      "Short-form content die blijft hangen: statische posts, carrousels, reels en animaties. Plus AI-renders o.b.v. schetsen, AI-animaties, bedrijfsvideo's, commercials en podcast.",
    note: "Stel je maandelijkse contentplan samen — pas het aantal per item aan.",
    packages: [
      {
        id: "org-static",
        name: "Statische posts & carrousels",
        tagline: "Op-merk beeld voor social.",
        kind: "item",
        price: { monthly: 45, suffix: "stuk" },
        features: ["Statische post of carrousel", "Volledig in je huisstijl", "Klaar-om-te-plaatsen"],
        recommends: ["tracking"],
      },
      {
        id: "org-reel",
        name: "Short-form reels",
        tagline: "Korte video's & animaties.",
        kind: "item",
        price: { monthly: 195, suffix: "stuk" },
        features: ["Reel of animatie (max. 1 min.)", "Opname of motion design", "Ondertiteling & merk-outro"],
        recommends: ["tracking"],
      },
      {
        id: "org-airender",
        name: "AI-renders (schets → beeld)",
        tagline: "Van tekening naar fotorealisme.",
        kind: "item",
        price: { setup: 195, suffix: "stuk" },
        features: ["O.b.v. jouw schetsen of tekeningen", "Fotorealistisch of stylized", "Voor niet-bestaande producten"],
      },
      {
        id: "org-aimotion",
        name: "AI-animatie / bewegend beeld",
        tagline: "Stilstaand beeld tot leven.",
        kind: "item",
        price: { setup: 395, suffix: "stuk" },
        features: ["AI-motion op je beelden", "Cinematic bewegend beeld", "Voor hero's & ads"],
      },
      {
        id: "org-ai",
        name: "AI-beeld abonnement",
        tagline: "Zeg vaarwel tegen stock.",
        kind: "addon",
        price: { monthly: 95 },
        features: ["Doorlopend AI-beeld op maat", "Consistente merkstijl", "Onbeperkt binnen fair-use"],
      },
      {
        id: "org-video",
        name: "Bedrijfsvideo / commercial",
        tagline: "Scripting, opname & productie.",
        kind: "item",
        price: { setup: 1250, suffix: "stuk" },
        features: ["Bedrijfsvideo van 2–3 minuten", "Scripting & regie", "Montage & kleurcorrectie"],
      },
      {
        id: "org-podcast",
        name: "Podcast-productie",
        tagline: "Van opname tot aflevering.",
        kind: "item",
        price: { setup: 675, suffix: "afl." },
        features: ["Opname op locatie of studio", "Montage & audioclean-up", "Social snippets"],
      },
    ],
  },

  // ========================================================== PAID ADS
  {
    id: "paid",
    label: "Paid Ads",
    kicker: "Marketing · betaald",
    blurb:
      "Van account-inrichting tot schaalbare campagnes. Inclusief zoekwoord- & doelgroeponderzoek en campagne-strategie op Meta, LinkedIn, Reddit of TikTok.",
    note: "Advertentiebudget (ad-spend) is exclusief en betaal je rechtstreeks aan het platform.",
    options: [
      {
        id: "platforms",
        label: "Kanalen",
        multi: true,
        choices: ["Meta (IG/FB)", "LinkedIn", "Reddit", "TikTok"],
      },
    ],
    packages: [
      {
        id: "ads-starter",
        name: "Ads Starter",
        tagline: "Zet staand op één kanaal.",
        kind: "plan",
        price: { setup: 350, monthly: 295 },
        features: [
          "Inrichting Meta Business & Ad Account",
          "1 platform",
          "Zoekwoord- & doelgroeponderzoek",
          "Campagne-draft & strategie",
          "Maandelijkse optimalisatie",
        ],
        recommends: ["tracking"],
      },
      {
        id: "ads-growth",
        name: "Ads Growth",
        tagline: "Testen, retargeten, groeien.",
        kind: "plan",
        price: { setup: 550, monthly: 595 },
        highlight: true,
        badge: "Populair",
        features: [
          "Tot 2 platforms",
          "A/B-testing van creatives",
          "Retargeting-funnels",
          "Wekelijkse optimalisatie",
          "Conversie-rapportage",
        ],
        recommends: ["tracking", "seo", "funnels"],
      },
      {
        id: "ads-scale",
        name: "Ads Scale",
        tagline: "Full-funnel op meerdere kanalen.",
        kind: "plan",
        price: { monthly: 995, custom: true },
        features: [
          "3+ platforms",
          "Full-funnel strategie",
          "Creative-productie inbegrepen",
          "Dedicated strateeg",
          "Realtime dashboard",
        ],
        recommends: ["tracking", "seo", "funnels"],
      },
    ],
  },

  // ========================================================== SEO / AEO
  {
    id: "seo",
    label: "SEO / AEO",
    kicker: "Vindbaar & citeerbaar",
    blurb:
      "Organisch groeien met content o.b.v. thema's & actualiteiten (incl. webscraping) én zichtbaar worden in AI-antwoorden via slimme FAQ's en gestructureerde data.",
    note: "Drafts worden ter review klaargezet — jij houdt de regie over publicatie.",
    packages: [
      {
        id: "seo-boost",
        name: "Quick SEO Boost",
        tagline: "Snelle vindbaarheidswinst.",
        kind: "plan",
        price: { setup: 475 },
        features: ["Meta-titels & -beschrijvingen", "Zoekwoordonderzoek", "Mediacompressie", "Technische SEO-scan"],
      },
      {
        id: "seo-growth",
        name: "SEO Growth",
        tagline: "Doorlopende content & optimalisatie.",
        kind: "plan",
        price: { monthly: 395 },
        highlight: true,
        badge: "Populair",
        features: [
          "2 blogs / landingspagina's p/m",
          "O.b.v. thema's & actualiteiten (webscraping)",
          "Drafts klaargezet ter review",
          "Doorlopende paginaoptimalisatie",
          "Interne linkstructuur",
        ],
      },
      {
        id: "seo-authority",
        name: "SEO Authority",
        tagline: "Autoriteit & linkbuilding.",
        kind: "plan",
        price: { monthly: 795 },
        features: [
          "Alles uit Growth",
          "4 contentstukken p/m",
          "Linkbuilding & digital PR",
          "Concurrentie-monitoring",
          "Kwartaal-SEO-strategie",
        ],
      },
      {
        id: "aeo-answers",
        name: "AEO — Answer Engine",
        tagline: "Gevonden worden dóór AI.",
        kind: "addon",
        price: { setup: 450, monthly: 75 },
        badge: "GEO",
        features: [
          "FAQ-hub (helpdesk & kennisbank)",
          "Cross-referenced slimme vragen",
          "JSON-LD schema's (FAQ, Article, Organization, Product)",
          "robots.txt & llms.txt",
          "GEO- & actualiteitsgericht",
          "Optimalisatie voor ChatGPT, Gemini & Perplexity",
        ],
      },
    ],
  },

  // ========================================================== TRACKING
  {
    id: "tracking",
    label: "Tracking",
    kicker: "Meten & compliance",
    blurb:
      "Weten wat werkt. Van GA4 en Meta Pixel tot server-side tracking en dashboards — volledig AVG-proof met cookie-consent en Consent Mode.",
    packages: [
      {
        id: "trk-foundation",
        name: "Foundation",
        tagline: "De basis netjes op orde.",
        kind: "plan",
        price: { setup: 195, monthly: 15 },
        features: ["GA4 + Google Tag Manager", "Meta Pixel", "Basis-conversies", "Cookie-consent (CMP) & compliance"],
      },
      {
        id: "trk-server",
        name: "Server-side",
        tagline: "Betrouwbaar meten na iOS & consent.",
        kind: "plan",
        price: { setup: 495, monthly: 45 },
        highlight: true,
        badge: "Populair",
        features: [
          "Alles uit Foundation",
          "Server-side tracking (sGTM)",
          "Meta Conversions API",
          "Enhanced conversions",
          "Consent Mode v2 & custom events",
        ],
      },
      {
        id: "trk-insights",
        name: "Insights Pro",
        tagline: "Van data naar beslissingen.",
        kind: "plan",
        price: { setup: 795, monthly: 95 },
        features: [
          "Alles uit Server-side",
          "Looker Studio dashboards",
          "Attributiemodellen",
          "Funnel- & cohortanalyse",
          "Maandelijkse datarapportage",
        ],
      },
    ],
  },

  // ========================================================== FUNNELS
  {
    id: "funnels",
    label: "Funnels",
    kicker: "Configuratoren & lead-flows",
    blurb:
      "Geavanceerde, custom lead-machines: reken- en configuratormodules, offerte-flows en opt-ins — met optionele e-mailreeks en automatische audience-sync.",
    note: "Hostingkosten van externe services (Make / Zapier / Resend) vallen onder dit pakket.",
    packages: [
      {
        id: "fun-calc",
        name: "Terugverdientijd-module",
        tagline: "Reken je klant naar 'ja'.",
        kind: "item",
        price: { setup: 950 },
        features: ["Interactieve rekentool", "Custom logica & branding", "Realtime resultaat", "Lead-capture"],
        recommends: ["tracking"],
      },
      {
        id: "fun-quote",
        name: "Offerte-aanvraagflow",
        tagline: "Van interesse naar offerte.",
        kind: "item",
        price: { setup: 1250 },
        highlight: true,
        badge: "Populair",
        features: ["Multi-step configurator", "Voorwaardelijke logica", "Automatische offerte-PDF", "CRM-doorzet"],
        recommends: ["crm", "tracking"],
      },
      {
        id: "fun-config",
        name: "Product-configurator",
        tagline: "Laat klanten zelf samenstellen.",
        kind: "item",
        price: { setup: 1750 },
        features: ["Visuele configurator", "Prijslogica & varianten", "Deelbare configuraties"],
        recommends: ["crm"],
      },
      {
        id: "fun-ebook",
        name: "E-book / download opt-in",
        tagline: "Waarde weggeven, leads oogsten.",
        kind: "item",
        price: { setup: 450 },
        features: ["Branded opt-in", "Automatische levering via persoonlijke e-mail", "Dubbele opt-in (AVG)"],
        recommends: ["organic"],
      },
      {
        id: "fun-email",
        name: "E-mailreeks / nurture",
        tagline: "Blijf top-of-mind.",
        kind: "addon",
        price: { setup: 350, monthly: 45 },
        features: ["Geautomatiseerde reeks", "Branded templates", "Dynamische tags"],
        recommends: ["hosting"],
      },
      {
        id: "fun-audience",
        name: "Audience-sync",
        tagline: "Leads automatisch gesegmenteerd.",
        kind: "addon",
        price: { monthly: 25 },
        features: [
          "Naar Mailchimp / ActiveCampaign / Mailblue / MailerLite",
          "Dynamische tagging & segmentatie",
          "Realtime doorzet",
        ],
      },
    ],
  },

  // ========================================================== CRM & INTEGRATIES
  {
    id: "crm",
    label: "CRM & Integraties",
    kicker: "Maatwerk",
    blurb:
      "Geavanceerde CRM- en projectmanagement-inrichting op Odoo, HubSpot, Pipedrive, Teamleader of Notion — plus custom API-koppelingen. Scope en beheerfee spreken we op maat af.",
    note: "Alles op maat — we bepalen samen de scope en de doorlopende beheerfee.",
    packages: [
      {
        id: "crm-setup",
        name: "CRM-inrichting",
        tagline: "Jouw systeem, slim ingericht.",
        kind: "plan",
        price: { custom: true },
        features: [
          "Odoo · HubSpot · Pipedrive · Teamleader · Notion",
          "Pipelines & automations op maat",
          "Data-migratie",
          "Team-onboarding",
        ],
      },
      {
        id: "crm-api",
        name: "Custom API-integratie",
        tagline: "Alles met alles verbonden.",
        kind: "plan",
        price: { custom: true },
        features: ["Koppeling met CRM & externe tools", "Webhooks & datastromen", "Foutafhandeling & logging"],
      },
      {
        id: "crm-manage",
        name: "Beheer & optimalisatie",
        tagline: "Meegroeien met je proces.",
        kind: "plan",
        price: { monthly: 0, custom: true },
        features: ["Doorlopend beheer", "Nieuwe automations", "Beheerfee op maat"],
      },
    ],
  },

  // ========================================================== HOSTING
  {
    id: "hosting",
    label: "Hosting",
    kicker: "Solide fundament",
    blurb:
      "Van A tot Z geregeld: domein & DNS, back-ups en maximale veiligheid. Op WordPress (evt. WooCommerce) of Webflow — inclusief hosting van je automations.",
    note: "Vanafprijzen — worden op basis van volume/gebruik nagerekend. Uurtarief buiten scope € 95.",
    options: [
      {
        id: "platform",
        label: "Platform",
        choices: ["WordPress", "WooCommerce", "Webflow"],
        triggers: { WooCommerce: "tracking" },
      },
    ],
    packages: [
      {
        id: "host-basic",
        name: "Basic",
        tagline: "Voor een solide basis.",
        kind: "plan",
        price: { setup: 95, monthly: 19 },
        features: [
          "Domein- & DNS-management",
          "Redirect-management",
          "Dagelijkse back-ups",
          "SSL-certificaat & 99.8% uptime",
          "Support bij storingen",
          "Tot 3 mailaccounts",
        ],
        recommends: ["support"],
      },
      {
        id: "host-premium",
        name: "Premium",
        tagline: "Voor actieve websites.",
        kind: "plan",
        price: { setup: 145, monthly: 39 },
        highlight: true,
        badge: "Populair",
        features: [
          "Alles uit Basic",
          "2 domeinregistraties + 1 subdomein",
          "Tot 5 mailaccounts",
          "Premium support",
          "500 API-operations",
          "Staging-omgeving",
        ],
        recommends: ["support", "tracking"],
      },
      {
        id: "host-taylored",
        name: "Taylored",
        tagline: "Voor digitale raketten.",
        kind: "plan",
        price: { monthly: 95, suffix: "+", custom: true },
        features: [
          "Test- & productieomgeving",
          "5+ domeinen · 10+ mailaccounts",
          "Cloud / VPS-hosting",
          "DDoS-beveiliging & flexibel schalen",
          "1M+ API-operations",
          "Persoonlijke accountmanager",
        ],
        recommends: ["support", "tracking", "funnels"],
      },
      {
        id: "host-automation",
        name: "Automation-hosting",
        tagline: "Draaiuren voor je scenario's.",
        kind: "addon",
        price: { monthly: 15 },
        features: ["Beheer van Make / Zapier / n8n", "Monitoring van scenario's", "Transactionele e-mail (Resend)"],
        recommends: ["funnels"],
      },
    ],
  },

  // ========================================================== SUPPORT / WEBPLANS
  {
    id: "support",
    label: "Support",
    kicker: "Webplans",
    blurb:
      "Vast technisch onderhoud en ondersteuning over de hele linie. Updates, monitoring, spamfiltering en hulp bij website-, domein- en DNS-configuratie.",
    note: "Support omvat alle bestede uren: advies, aanpassingen en overige ondersteuning. Uurtarief buiten scope € 75.",
    packages: [
      {
        id: "sup-mini",
        name: "Mini",
        tagline: "Enkel het noodzakelijke.",
        kind: "plan",
        price: { monthly: 19 },
        features: [
          "Periodieke updates van plug-ins & thema's",
          "Periodieke check & onderhoud van services",
          "Spamfiltering & mailhygiëne",
          "Basic support (binnen 48u)",
        ],
      },
      {
        id: "sup-solid",
        name: "Solid",
        tagline: "Voor actieve websites.",
        kind: "plan",
        price: { monthly: 79 },
        features: [
          "1 support-uur per maand",
          "Doorlopende monitoring & onderhoud",
          "Uptime- & security-monitoring",
          "Malware-scanning",
          "Support bij domein / DNS-configuratie",
        ],
      },
      {
        id: "sup-build",
        name: "Build",
        tagline: "Voor doorlopende doorontwikkeling.",
        kind: "plan",
        price: { monthly: 199 },
        highlight: true,
        badge: "Populair",
        features: [
          "3 support-uren per maand",
          "Alles uit Solid",
          "Prioriteit support (binnen 24u)",
          "Maandelijkse performance-optimalisatie",
          "Broken-link & SEO-health checks",
          "Maandelijkse rapportage",
        ],
      },
      {
        id: "sup-max",
        name: "Max",
        tagline: "Alles uit handen.",
        kind: "plan",
        price: { monthly: 349 },
        features: [
          "5 support-uren per maand",
          "Alles uit Build",
          "Same-day support",
          "Proactief technisch onderhoud",
          "Kwartaal-strategiecall",
        ],
      },
    ],
  },
];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

export const CATEGORY_BY_ID: Record<IconKey, Category> = Object.fromEntries(
  CATALOG.map((c) => [c.id, c])
) as Record<IconKey, Category>;

export const PKG_BY_ID: Record<string, { pkg: Pkg; cat: Category }> = Object.fromEntries(
  CATALOG.flatMap((cat) => cat.packages.map((pkg) => [pkg.id, { pkg, cat }]))
);

/** Vaste volgorde van categorieën zoals ze in de catalogus staan. */
export const CATEGORY_ORDER: IconKey[] = CATALOG.map((c) => c.id);

export function formatEuro(n: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Bouwt op basis van de intake (startpunt + doelen) een geordend,
 * aanbevolen pad door de catalogus. Volgorde volgt CATEGORY_ORDER
 * zodat de klant natuurlijk van boven naar beneden stroomt.
 */
export function journeyFor(stageId: string | null, goalIds: string[]): IconKey[] {
  const set = new Set<IconKey>();
  const stage = STAGES.find((s) => s.id === stageId);
  stage?.boost.forEach((c) => set.add(c));
  for (const gid of goalIds) {
    const goal = GOALS.find((g) => g.id === gid);
    goal?.targets.forEach((c) => set.add(c));
  }
  return CATEGORY_ORDER.filter((c) => set.has(c));
}

/**
 * Conditionele cross-sell: wat gaat er logisch samen met de huidige
 * selectie? Combineert per-pakket `recommends`, optie-triggers én een
 * set slimme globale regels. Categorieën waar al iets uit gekozen is,
 * worden weggelaten.
 */
export function recommendationsFor(
  selectedIds: Set<string>,
  chosenOptions: Record<string, string[]>
): Set<IconKey> {
  const recs = new Set<IconKey>();

  for (const id of selectedIds) {
    PKG_BY_ID[id]?.pkg.recommends?.forEach((r) => recs.add(r));
  }

  for (const cat of CATALOG) {
    for (const opt of cat.options ?? []) {
      for (const val of chosenOptions[opt.id] ?? []) {
        const t = opt.triggers?.[val];
        if (t) recs.add(t);
      }
    }
  }

  const has = (prefix: string) => [...selectedIds].some((id) => id.startsWith(prefix));
  const anySelected = selectedIds.size > 0;

  // Globale flow-regels (conditioneel).
  if (has("brand-")) {
    recs.add("print");
    recs.add("websites");
  }
  if (has("print-")) recs.add("branding");
  if (has("web-") && !has("wapp-")) {
    ["hosting", "support", "seo", "tracking", "funnels"].forEach((c) => recs.add(c as IconKey));
  }
  if (has("shop-")) {
    ["tracking", "seo", "hosting", "support", "funnels"].forEach((c) => recs.add(c as IconKey));
  }
  if (has("wapp-")) {
    ["hosting", "support", "crm", "funnels", "tracking"].forEach((c) => recs.add(c as IconKey));
  }
  if (has("mob-")) {
    ["webapps", "support", "crm"].forEach((c) => recs.add(c as IconKey));
  }
  if (has("org-") || has("ads-")) recs.add("tracking");
  if (has("ads-")) {
    recs.add("seo");
    recs.add("funnels");
  }
  if (has("fun-")) {
    recs.add("crm");
    recs.add("hosting");
  }
  if (anySelected) recs.add("support");

  // Verwijder categorieën waar al iets uit gekozen is.
  for (const id of selectedIds) {
    const entry = PKG_BY_ID[id];
    if (entry) recs.delete(entry.cat.id);
  }

  return recs;
}

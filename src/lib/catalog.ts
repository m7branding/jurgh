// ============================================================
// M7 — Service Catalogus (data + aanbevelingslogica)
// Klanten stellen hier zelf een dienstverlening samen: elke
// categorie bevat plannen (kies-één), add-ons (meerdere) en/of
// items (met aantal). Prijzen zijn "vanafprijzen".
// ============================================================

export type IconKey =
  | "hosting"
  | "support"
  | "organic"
  | "paid"
  | "tracking"
  | "seo"
  | "funnels"
  | "crm";

export type Price = {
  /** Eenmalige (setup) kosten in euro. */
  setup?: number;
  /** Doorlopende kosten per maand in euro. */
  monthly?: number;
  /** true = op aanvraag / maatwerk. */
  custom?: boolean;
  /** "+" toont een vanaf-indicatie, "stuk"/"mnd" toont een eenheid. */
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
  /** markeert het populairste plan. */
  highlight?: boolean;
  badge?: string;
  /** categorie-id's die logisch samen gaan met dit pakket. */
  recommends?: IconKey[];
};

export type CategoryOption = {
  id: string;
  label: string;
  choices: string[];
  /** true = meerdere keuzes mogelijk (chips), anders segmented single. */
  multi?: boolean;
  /** keuze die een aanbeveling triggert → categorie-id. */
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

export const CATALOG: Category[] = [
  // ---------------------------------------------------------- HOSTING
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
        features: [
          "Beheer van Make / Zapier / n8n",
          "Monitoring van scenario's",
          "Transactionele e-mail (Resend)",
        ],
        recommends: ["funnels"],
      },
    ],
  },

  // ---------------------------------------------------------- SUPPORT / WEBPLANS
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

  // ---------------------------------------------------------- ORGANISCHE MARKETING
  {
    id: "organic",
    label: "Organisch",
    kicker: "Marketing · content",
    blurb:
      "Short-form content die blijft hangen: statische posts, carrousels, reels en animaties — desgewenst met AI-gegenereerd beeld. Plus bedrijfsvideo's, commercials en podcast.",
    note: "Stel je maandelijkse contentplan samen — pas het aantal per item aan.",
    packages: [
      {
        id: "org-static",
        name: "Statische posts & carrousels",
        tagline: "Op-merk beeld voor social.",
        kind: "item",
        price: { monthly: 45, suffix: "stuk" },
        features: ["Statische post of carrousel", "Volledig in je huisstijl", "Aangeleverd klaar-om-te-plaatsen"],
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
        id: "org-ai",
        name: "AI-beeld & -content",
        tagline: "Zeg vaarwel tegen stock.",
        kind: "addon",
        price: { monthly: 95 },
        features: ["AI-gegenereerde beelden op maat", "Voor niet-bestaande producten of diensten", "Consistente merkstijl"],
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

  // ---------------------------------------------------------- PAID ADS
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
        recommends: ["tracking", "seo"],
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

  // ---------------------------------------------------------- TRACKING
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
        features: [
          "GA4 + Google Tag Manager",
          "Meta Pixel",
          "Basis-conversies",
          "Cookie-consent (CMP) & compliance",
        ],
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

  // ---------------------------------------------------------- SEO / AEO
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
        features: [
          "Meta-titels & -beschrijvingen",
          "Zoekwoordonderzoek",
          "Mediacompressie",
          "Technische SEO-scan",
        ],
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

  // ---------------------------------------------------------- FUNNELS
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

  // ---------------------------------------------------------- CRM & INTEGRATIES
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
        features: [
          "Koppeling met CRM & externe tools",
          "Webhooks & datastromen",
          "Foutafhandeling & logging",
        ],
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

export function formatEuro(n: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Bepaalt welke categorieën logisch als "volgende stap" worden aanbevolen
 * op basis van de huidige selectie. Combineert per-pakket `recommends`,
 * gekozen opties én een paar slimme globale regels.
 */
export function recommendationsFor(
  selectedIds: Set<string>,
  chosenOptions: Record<string, string[]>
): Set<IconKey> {
  const recs = new Set<IconKey>();

  for (const id of selectedIds) {
    const entry = PKG_BY_ID[id];
    entry?.pkg.recommends?.forEach((r) => recs.add(r));
  }

  // Optie-triggers (bijv. WooCommerce → tracking).
  for (const cat of CATALOG) {
    for (const opt of cat.options ?? []) {
      const picked = chosenOptions[opt.id] ?? [];
      for (const val of picked) {
        const t = opt.triggers?.[val];
        if (t) recs.add(t);
      }
    }
  }

  const has = (prefix: string) =>
    [...selectedIds].some((id) => id.startsWith(prefix));
  const anySelected = selectedIds.size > 0;

  // Globale flow-regels.
  if (has("org-") || has("ads-")) recs.add("tracking");
  if (has("ads-")) recs.add("seo");
  if (has("seo-")) recs.add("seo"); // AEO zit in dezelfde categorie
  if (has("fun-")) {
    recs.add("crm");
    recs.add("hosting");
  }
  if (anySelected) recs.add("support");

  // Verwijder categorieën waar al iets uit gekozen is (geen ruis).
  for (const id of selectedIds) {
    const entry = PKG_BY_ID[id];
    if (entry) recs.delete(entry.cat.id);
  }

  return recs;
}

// JURGH loyalty / spaarsysteem — tiers + rewards.
// Afbeeldingen komen van shop.detailing.nl (productfoto's).

export type TierKey = "bronze" | "silver" | "gold" | "platinum";

export type Tier = {
  key: TierKey;
  label: string;
  min: number; // benodigde punten
  from: string; // gradient-kleuren voor de badge
  to: string;
};

export const TIERS: Tier[] = [
  { key: "bronze", label: "Bronze Client", min: 0, from: "#e0a472", to: "#a6692f" },
  { key: "silver", label: "Silver Client", min: 500, from: "#e6e9ee", to: "#9aa3af" },
  { key: "gold", label: "Gold Client", min: 1500, from: "#f1d488", to: "#bd932f" },
  { key: "platinum", label: "Platinum Client", min: 3000, from: "#dfe7f2", to: "#8aa0bf" },
];

export type Reward = {
  id: string;
  points: number;
  name: string;
  description: string;
  tier: TierKey;
  image: string;
};

// Volgorde = oplopend in punten = het "pad" dat de klant aflegt.
export const REWARDS: Reward[] = [
  {
    id: "interieur-check",
    points: 250,
    name: "Gratis interieur check",
    description: "Een professionele controle en opfrisser van je interieur.",
    tier: "bronze",
    image:
      "https://shop.detailing.nl/wp-content/uploads/2019/01/product-picture-iclean-6000x4000-300dpi-ISOLATED-700x467.png",
  },
  {
    id: "wash-n-shine",
    points: 500,
    name: "Gratis Wash 'n Shine",
    description: "Een complete Wash 'n Shine-beurt van het huis.",
    tier: "silver",
    image: "https://shop.detailing.nl/wp-content/uploads/2026/03/Magic-Shampoo-520x520.png",
  },
  {
    id: "onderhoudsinspectie",
    points: 1000,
    name: "Gratis onderhoudsinspectie",
    description: "Volledige check-up van coating, lak en bescherming.",
    tier: "silver",
    image:
      "https://shop.detailing.nl/wp-content/uploads/2016/05/Wash-Mitt-Double-Face-Microfibre-520x520.jpg",
  },
  {
    id: "glascoating-onderhoud",
    points: 1500,
    name: "Gratis glascoating onderhoudsbeurt",
    description: "Frisse glans en topbescherming met een onderhoudsbeurt.",
    tier: "gold",
    image: "https://shop.detailing.nl/wp-content/uploads/2026/02/Initio-520x520.webp",
  },
  {
    id: "diy-pakket",
    points: 2500,
    name: "Gratis DIY detailing pakket",
    description: "Een verzorgingspakket uit shop.detailing.nl voor thuis.",
    tier: "gold",
    image:
      "https://shop.detailing.nl/wp-content/uploads/2020/10/Primus-4500-ML-Foam-Prewash-520x520.jpg",
  },
  {
    id: "platinum-cadeau",
    points: 3000,
    name: "Platinum cadeau uit de JURGH Shop",
    description: "Een exclusief cadeau voor onze Platinum Clients.",
    tier: "platinum",
    image: "https://shop.detailing.nl/wp-content/uploads/2019/02/leer-en-vinyl-reiniger-520x520.jpg",
  },
];

export function currentTier(points: number): Tier {
  return [...TIERS].reverse().find((t) => points >= t.min) ?? TIERS[0];
}

export function nextTier(points: number): Tier | null {
  return TIERS.find((t) => t.min > points) ?? null;
}

/** Eerstvolgende nog niet behaalde reward (het huidige doel). */
export function nextLockedReward(points: number): Reward | null {
  return REWARDS.find((r) => points < r.points) ?? null;
}

export function tierOf(key: TierKey): Tier {
  return TIERS.find((t) => t.key === key) ?? TIERS[0];
}

/** Voortgang (0-100) richting de eerstvolgende reward. */
export function progressToNext(points: number): { pct: number; target: Reward | null } {
  const target = nextLockedReward(points);
  if (!target) return { pct: 100, target: null };
  const unlocked = REWARDS.filter((r) => r.points <= points);
  const prev = unlocked.length ? Math.max(...unlocked.map((r) => r.points)) : 0;
  const pct = Math.round(((points - prev) / (target.points - prev)) * 100);
  return { pct: Math.max(0, Math.min(100, pct)), target };
}

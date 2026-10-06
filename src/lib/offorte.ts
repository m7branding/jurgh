// ============================================================
// Offorte: API-client + vertaling van een offerte naar portaalvelden.
//
// De API-sleutel en het accountnaam komen uit de omgeving en staan nooit
// in de repo. Base-URL en authenticatie volgens de Offorte API v2:
//   https://connect.offorte.com/api/v2/{account}/...  met header Authorization.
//
// De mappers hieronder zijn pure functies: ze vullen alleen wat de offerte
// echt bevat. Wat leeg is in Offorte blijft leeg in het portaal.
// ============================================================

import type { ProjectType } from "@/lib/constants";

const BASE = "https://connect.offorte.com/api/v2";

export class OfforteError extends Error {}

function config() {
  const account = process.env.OFFORTE_ACCOUNT;
  const apiKey = process.env.OFFORTE_API_KEY;
  if (!account || !apiKey) {
    throw new OfforteError("OFFORTE_ACCOUNT of OFFORTE_API_KEY ontbreekt in de omgeving.");
  }
  return { account, apiKey };
}

export async function offorteFetch<T = any>(path: string): Promise<T> {
  const { account, apiKey } = config();
  const res = await fetch(`${BASE}/${account}/${path.replace(/^\//, "")}`, {
    headers: { Authorization: apiKey, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new OfforteError(`Offorte gaf status ${res.status} op ${path}`);
  }
  return (await res.json()) as T;
}

export type OfforteRow = {
  type?: string;
  content?: string;
  price?: number | string;
  quantity?: number | string;
  subtotal?: number | string;
  selectable?: boolean | string;
  user_selected?: boolean;
};

export type OfforteProposal = {
  id: number | string;
  name?: string;
  proposal_nr?: string;
  status?: string;
  date_won?: string | null;
  price_total_original?: string | number | null;
  contact?: Record<string, any>;
  receivers?: { fullname?: string | null; email?: string | null; pass?: string | null }[];
  content?: { pricetables?: { rows?: OfforteRow[] }[] };
};

export type AcceptedRow = { label: string; price: number; quantity: number; subtotal: number };

// ---------- tekst ----------

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Offorte levert HTML in de regels; die moet als platte tekst het portaal in. */
export function decodeHtml(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[String(name).toLowerCase()] ?? m);
}

export function stripHtml(input: string): string {
  return decodeHtml(
    String(input ?? "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  ).trim();
}

/** Eerste regel van een prijsregel: de omschrijving zonder de toelichting eronder. */
export function rowLabel(row: OfforteRow): string {
  return stripHtml(row.content ?? "").split("\n")[0].trim();
}

/**
 * Contacten die via een webformulier zijn aangemaakt krijgen soms een
 * tijdstempel achter hun naam ("Jorris van Doorn -2026-06-29T13:54:37.173Z-").
 */
export function cleanContactName(name: string): string {
  return String(name ?? "")
    .replace(/\s*-?\s*\d{4}-\d{2}-\d{2}T[\d:.]+Z\s*-?\s*$/, "")
    .replace(/[\s-]+$/, "")
    .trim();
}

// ---------- prijsregels ----------

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Een regel telt mee als de klant 'm heeft aangevinkt, of als de regel
 * helemaal niet optioneel was. Alleen echte prijsregels — titel- en
 * subtotaalregels zijn opmaak.
 */
export function isRowAccepted(row: OfforteRow): boolean {
  if (row.type !== "price") return false;
  return !row.selectable || row.user_selected === true;
}

export function acceptedRows(proposal: OfforteProposal): AcceptedRow[] {
  const tables = proposal.content?.pricetables ?? [];
  const rows: AcceptedRow[] = [];
  for (const table of tables) {
    for (const row of table.rows ?? []) {
      if (!isRowAccepted(row)) continue;
      const label = rowLabel(row);
      if (!label) continue;
      rows.push({
        label,
        price: num(row.price),
        quantity: num(row.quantity) || 1,
        subtotal: num(row.subtotal),
      });
    }
  }
  return rows;
}

// ---------- projecttype ----------

// Volgorde telt bij een gelijkspel: specifiek vóór algemeen.
const TYPE_PATTERNS: { type: ProjectType; re: RegExp }[] = [
  { type: "ppf", re: /\bppf\b|paint protection/i },
  { type: "wrap", re: /\bwrap(pen|ping)?\b|carwrap|folie(ren)?\b/i },
  { type: "glascoating", re: /glas ?coating|glascaoting|keramische coating|ceramic/i },
  { type: "schadeherstel", re: /spuitwerk|uitdeuk|schadeherstel|lakschade|steenslag|deuk/i },
  { type: "detailing", re: /detailing|polijst|poets|interieurreiniging|reinig|wassen|leercoating/i },
  { type: "upgrade", re: /tinten|sterrenhemel|dashcam|alarm|volgsysteem|velg|anti.?laser|blue ?eye|upgrade/i },
];

/**
 * Het zwaarste type wint, gewogen op bedrag: een offerte met €2295 PPF en
 * €275 voorbereidend poetswerk is een PPF-project.
 */
export function deriveProjectType(rows: AcceptedRow[]): ProjectType {
  const scores = new Map<ProjectType, number>();
  for (const row of rows) {
    for (const { type, re } of TYPE_PATTERNS) {
      if (re.test(row.label)) {
        scores.set(type, (scores.get(type) ?? 0) + Math.max(row.subtotal, row.price, 1));
      }
    }
  }
  let best: ProjectType | null = null;
  let bestScore = 0;
  for (const { type } of TYPE_PATTERNS) {
    const score = scores.get(type) ?? 0;
    if (score > bestScore) {
      best = type;
      bestScore = score;
    }
  }
  return best ?? "overig";
}

const LOANER_RE = /vervangend vervoer|leen ?auto|vervangende auto/i;
const TRANSPORT_RE = /\btransport\b|halen en brengen|haal- ?en ?breng|ophaalservice|brengservice|ophalen en terugbrengen/i;

export function detectLoanerCar(rows: AcceptedRow[]): boolean {
  return rows.some((r) => LOANER_RE.test(r.label));
}

export function detectTransport(rows: AcceptedRow[]): boolean {
  return rows.some((r) => TRANSPORT_RE.test(r.label));
}

// ---------- kenteken uit de offertenaam ----------

/**
 * Offertes heten bijvoorbeeld "Audi SQ5 K-744-PN" of
 * "PPF Gold voor Porsche 911 Targa 4s (KLG-11-S)". Deze functie levert de
 * kandidaten van zes tekens met minstens één letter én één cijfer; welke
 * kandidaat een écht kenteken is, bepaalt de RDW.
 */
export function platecandidatesFrom(text: string): string[] {
  const found = new Set<string>();
  const matches = String(text ?? "").match(/[A-Za-z0-9]{1,6}(?:-[A-Za-z0-9]{1,6}){0,3}/g) ?? [];
  for (const match of matches) {
    const plate = match.replace(/-/g, "").toUpperCase();
    if (plate.length !== 6) continue;
    if (!/[A-Z]/.test(plate) || !/[0-9]/.test(plate)) continue;
    found.add(plate);
  }
  return [...found];
}

// ---------- klantgegevens ----------

export type MappedCustomer = {
  offorteContactId: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  isBusiness: boolean;
  companyName: string | null;
};

/**
 * Let op: contact.type "organisation" zegt hier niets — veel particulieren
 * staan zo in Offorte. Een KvK- of btw-nummer is het enige harde signaal
 * dat het om een zakelijke klant gaat.
 */
export function mapCustomer(proposal: OfforteProposal): MappedCustomer {
  const contact = proposal.contact ?? {};
  const receiver = proposal.receivers?.[0];

  const rawName =
    contact.fullname ||
    receiver?.fullname ||
    contact.name ||
    [contact.firstname, contact.lastname].filter(Boolean).join(" ");

  const isBusiness = Boolean(
    String(contact.coc_number ?? "").trim() || String(contact.vat_number ?? "").trim()
  );

  return {
    offorteContactId: contact.contact_id ? Number(contact.contact_id) : contact.id ? Number(contact.id) : null,
    name: cleanContactName(rawName) || "Onbekende klant",
    email: String(contact.email || receiver?.email || "").trim() || null,
    phone: String(contact.mobile || contact.phone || "").trim() || null,
    isBusiness,
    companyName: isBusiness ? cleanContactName(contact.name ?? "") || null : null,
  };
}

// ---------- offerte → project ----------

export type MappedProject = {
  title: string;
  type: ProjectType;
  price: number | null;
  loanerCar: boolean;
  transport: boolean;
  proposalNr: string | null;
  proposalUrl: string | null;
  acceptedRows: AcceptedRow[];
  plateCandidates: string[];
};

export function mapProject(proposal: OfforteProposal): MappedProject {
  const rows = acceptedRows(proposal);
  const name = String(proposal.name ?? "").trim();
  const nr = String(proposal.proposal_nr ?? "").trim();

  return {
    title: name || nr || `Offerte ${proposal.id}`,
    type: deriveProjectType(rows),
    // price_total_original is het subtotaal van de offerte: exclusief btw,
    // precies wat het prijsveld in het portaal verwacht.
    price:
      proposal.price_total_original != null && proposal.price_total_original !== ""
        ? Number(proposal.price_total_original)
        : null,
    loanerCar: detectLoanerCar(rows),
    transport: detectTransport(rows),
    proposalNr: nr || null,
    proposalUrl: proposal.receivers?.[0]?.pass ?? null,
    acceptedRows: rows,
    plateCandidates: platecandidatesFrom(name),
  };
}

/** Samenvatting van de geaccepteerde regels, voor de interne notitie. */
export function rowsSummary(rows: AcceptedRow[]): string {
  return rows
    .map((r) => `• ${r.label}${r.quantity > 1 ? ` (${r.quantity}×)` : ""} — € ${r.subtotal.toFixed(2)}`)
    .join("\n");
}

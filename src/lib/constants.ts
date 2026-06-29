// Centrale labels & metadata voor de UI (NL).

export type Role = "admin" | "medewerker" | "klant";

export type ProjectType = "glascoating" | "ppf" | "detailing" | "upgrade";

export type ProjectStatus =
  | "concept"
  | "offerte_aangevraagd"
  | "offerte_verstuurd"
  | "goedgekeurd"
  | "afspraak_ingepland"
  | "auto_ontvangen"
  | "in_behandeling"
  | "wacht_op_klant"
  | "kwaliteitscontrole"
  | "klaar_voor_oplevering"
  | "afgerond"
  | "gefactureerd"
  | "gearchiveerd";

export type DocumentType = "offerte" | "factuur" | "certificaat" | "overig";

export type PhotoLabel =
  | "voor_behandeling"
  | "tijdens_behandeling"
  | "na_behandeling"
  | "schade_bijzonderheid"
  | "detailfoto"
  | "oplevering";

export type WorkType =
  | "wassen"
  | "polijsten"
  | "glascoating"
  | "ppf_montage"
  | "interieur"
  | "inspectie"
  | "correctie"
  | "schadeherstel"
  | "oplevering"
  | "overig";

export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: "glascoating", label: "Glascoating" },
  { value: "ppf", label: "Paint Protection Film" },
  { value: "detailing", label: "Detailing Services" },
  { value: "upgrade", label: "Upgrade Your Car" },
];

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  glascoating: "Glascoating",
  ppf: "Paint Protection Film",
  detailing: "Detailing Services",
  upgrade: "Upgrade Your Car",
};

// Geordende statusflow (sectie 9). 'order' bepaalt de progress bar.
export const PROJECT_STATUSES: {
  value: ProjectStatus;
  label: string;
  order: number;
}[] = [
  { value: "concept", label: "Concept", order: 0 },
  { value: "offerte_aangevraagd", label: "Offerte aangevraagd", order: 1 },
  { value: "offerte_verstuurd", label: "Offerte verstuurd", order: 2 },
  { value: "goedgekeurd", label: "Goedgekeurd", order: 3 },
  { value: "afspraak_ingepland", label: "Afspraak ingepland", order: 4 },
  { value: "auto_ontvangen", label: "Auto ontvangen", order: 5 },
  { value: "in_behandeling", label: "In behandeling", order: 6 },
  { value: "wacht_op_klant", label: "Wacht op klant", order: 7 },
  { value: "kwaliteitscontrole", label: "Kwaliteitscontrole", order: 8 },
  { value: "klaar_voor_oplevering", label: "Klaar voor oplevering", order: 9 },
  { value: "afgerond", label: "Afgerond", order: 10 },
  { value: "gefactureerd", label: "Gefactureerd", order: 11 },
  { value: "gearchiveerd", label: "Gearchiveerd", order: 12 },
];

export const STATUS_LABEL: Record<ProjectStatus, string> = Object.fromEntries(
  PROJECT_STATUSES.map((s) => [s.value, s.label])
) as Record<ProjectStatus, string>;

export const STATUS_MAX_ORDER = 12;

export function statusOrder(status: ProjectStatus): number {
  return PROJECT_STATUSES.find((s) => s.value === status)?.order ?? 0;
}

// Kleur-tint voor de status badge
export function statusTone(status: ProjectStatus): "green" | "red" | "neutral" | "amber" {
  if (["afgerond", "gefactureerd", "klaar_voor_oplevering"].includes(status)) return "green";
  if (["wacht_op_klant", "kwaliteitscontrole"].includes(status)) return "amber";
  if (status === "gearchiveerd") return "neutral";
  return "red";
}

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "offerte", label: "Offerte" },
  { value: "factuur", label: "Factuur" },
  { value: "certificaat", label: "Garantiecertificaat" },
  { value: "overig", label: "Overig document" },
];

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  offerte: "Offerte",
  factuur: "Factuur",
  certificaat: "Garantiecertificaat",
  overig: "Document",
};

export const PHOTO_LABELS: { value: PhotoLabel; label: string }[] = [
  { value: "voor_behandeling", label: "Voor behandeling" },
  { value: "tijdens_behandeling", label: "Tijdens behandeling" },
  { value: "na_behandeling", label: "Na behandeling" },
  { value: "schade_bijzonderheid", label: "Schade / bijzonderheid" },
  { value: "detailfoto", label: "Detailfoto" },
  { value: "oplevering", label: "Oplevering" },
];

export const PHOTO_LABEL: Record<PhotoLabel, string> = Object.fromEntries(
  PHOTO_LABELS.map((p) => [p.value, p.label])
) as Record<PhotoLabel, string>;

export const WORK_TYPES: { value: WorkType; label: string }[] = [
  { value: "wassen", label: "Wassen" },
  { value: "polijsten", label: "Polijsten" },
  { value: "glascoating", label: "Glascoating" },
  { value: "ppf_montage", label: "PPF montage" },
  { value: "interieur", label: "Interieur" },
  { value: "inspectie", label: "Inspectie" },
  { value: "correctie", label: "Correctie" },
  { value: "schadeherstel", label: "Schadeherstel" },
  { value: "oplevering", label: "Oplevering" },
  { value: "overig", label: "Overig" },
];

export const WORK_TYPE_LABEL: Record<WorkType, string> = Object.fromEntries(
  WORK_TYPES.map((w) => [w.value, w.label])
) as Record<WorkType, string>;

export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

// ============================================================
// Kentekencheck via de open voertuigdata van de RDW.
// Dataset: "Gekentekende voertuigen" (m9d7-ebf2) op opendata.rdw.nl.
// Gratis en zonder account.
//
// Deze module bevat alleen de ruwe bevraging, zodat zowel het formulier
// (server action, met rolcontrole) als de Offorte-import er gebruik van
// kunnen maken.
// ============================================================

import { normalizePlate } from "@/lib/types";

const RDW_ENDPOINT = "https://opendata.rdw.nl/resource/m9d7-ebf2.json";

export type RdwVehicle = {
  plate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
};

/** Lege en niet-inhoudelijke waarden uit de RDW-data filteren. */
function clean(value: unknown): string | null {
  const text = String(value ?? "").trim();
  if (!text || /^(niet geregistreerd|n\.v\.t\.|onbekend)$/i.test(text)) return null;
  return text;
}

/** RDW schrijft alles in kapitalen; dat leest slecht in het formulier. */
function titleCase(value: string | null): string | null {
  if (!value) return null;
  if (value !== value.toUpperCase()) return value;
  return value
    .toLowerCase()
    .replace(/(^|[\s-/])([a-z])/g, (_m, sep: string, letter: string) => sep + letter.toUpperCase());
}

/**
 * Modelnamen bevatten vaak type-afkortingen ("DT 50 MX", "GTI"). Die blijven
 * in kapitalen; alleen echte woorden krijgen een hoofdletter.
 */
function titleCaseModel(value: string | null): string | null {
  if (!value) return null;
  if (value !== value.toUpperCase()) return value;
  return value
    .split(" ")
    .map((word) =>
      word.length > 3 && /[AEIOUY]/.test(word)
        ? word.charAt(0) + word.slice(1).toLowerCase()
        : word
    )
    .join(" ");
}

/** datum_eerste_toelating komt als YYYYMMDD. */
function yearFrom(value: unknown): number | null {
  const text = String(value ?? "").trim();
  const year = Number(text.slice(0, 4));
  return year >= 1900 && year <= new Date().getFullYear() + 1 ? year : null;
}

export class RdwUnavailableError extends Error {}

/**
 * Zoekt één kenteken op. `null` = kenteken bestaat niet bij de RDW.
 * Gooit RdwUnavailableError als de RDW zelf niet bereikbaar is, zodat een
 * storing niet als "kenteken onbekend" wordt gelezen.
 */
export async function fetchRdwVehicle(rawPlate: string): Promise<RdwVehicle | null> {
  const plate = normalizePlate(String(rawPlate || ""));
  if (plate.length < 6 || plate.length > 8) return null;

  let rows: any[];
  try {
    const res = await fetch(`${RDW_ENDPOINT}?kenteken=${encodeURIComponent(plate)}`, {
      headers: { Accept: "application/json" },
      // een dag cachen: voertuiggegevens veranderen zelden
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new RdwUnavailableError(`RDW gaf status ${res.status}`);
    rows = await res.json();
  } catch (e) {
    if (e instanceof RdwUnavailableError) throw e;
    throw new RdwUnavailableError("RDW niet bereikbaar");
  }

  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;

  return {
    plate,
    make: titleCase(clean(row.merk)),
    model: titleCaseModel(clean(row.handelsbenaming)),
    year: yearFrom(row.datum_eerste_toelating),
    color: titleCase(clean(row.eerste_kleur)),
  };
}

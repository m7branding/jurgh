"use server";

import { getSessionProfile } from "@/lib/auth";
import { normalizePlate } from "@/lib/types";

// ============================================================
// Kentekencheck via de open voertuigdata van de RDW.
// Dataset: "Gekentekende voertuigen" (m9d7-ebf2) op opendata.rdw.nl.
// Gratis en zonder account; we bevragen 'm vanaf de server zodat de browser
// geen externe call hoeft te doen (geen CORS) en Next het antwoord kan cachen.
// ============================================================

const RDW_ENDPOINT = "https://opendata.rdw.nl/resource/m9d7-ebf2.json";

export type PlateLookup =
  | {
      ok: true;
      plate: string;
      make: string | null;
      model: string | null;
      year: number | null;
      color: string | null;
    }
  | { ok: false; error: string };

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

/** datum_eerste_toelating komt als YYYYMMDD. */
function yearFrom(value: unknown): number | null {
  const text = String(value ?? "").trim();
  const year = Number(text.slice(0, 4));
  return year >= 1900 && year <= new Date().getFullYear() + 1 ? year : null;
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

export async function lookupLicensePlate(rawPlate: string): Promise<PlateLookup> {
  // Alleen ingelogde medewerkers/admins; voorkomt dat dit een open proxy wordt.
  const profile = await getSessionProfile();
  if (!profile || !["admin", "medewerker"].includes(profile.role)) {
    return { ok: false, error: "Geen toegang." };
  }

  const plate = normalizePlate(String(rawPlate || ""));
  if (plate.length < 6) return { ok: false, error: "Vul een volledig kenteken in." };
  if (plate.length > 8) return { ok: false, error: "Dit lijkt geen geldig kenteken." };

  let rows: any[];
  try {
    const res = await fetch(`${RDW_ENDPOINT}?kenteken=${encodeURIComponent(plate)}`, {
      headers: { Accept: "application/json" },
      // een dag cachen: voertuiggegevens veranderen zelden
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, error: "RDW is even niet bereikbaar. Vul de gegevens handmatig in." };
    rows = await res.json();
  } catch {
    return { ok: false, error: "RDW is even niet bereikbaar. Vul de gegevens handmatig in." };
  }

  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) {
    return { ok: false, error: `Kenteken ${plate} niet gevonden bij de RDW.` };
  }

  return {
    ok: true,
    plate,
    make: titleCase(clean(row.merk)),
    model: titleCaseModel(clean(row.handelsbenaming)),
    year: yearFrom(row.datum_eerste_toelating),
    color: titleCase(clean(row.eerste_kleur)),
  };
}

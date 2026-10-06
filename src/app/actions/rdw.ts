"use server";

import { getSessionProfile } from "@/lib/auth";
import { normalizePlate } from "@/lib/types";
import { fetchRdwVehicle, RdwUnavailableError } from "@/lib/rdw";

// Server action rond de RDW-bevraging: rolcontrole plus nette meldingen
// voor het formulier. De bevraging zelf staat in @/lib/rdw, zodat de
// Offorte-import (die geen ingelogde gebruiker heeft) 'm ook kan gebruiken.

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

export async function lookupLicensePlate(rawPlate: string): Promise<PlateLookup> {
  // Alleen ingelogde medewerkers/admins; voorkomt dat dit een open proxy wordt.
  const profile = await getSessionProfile();
  if (!profile || !["admin", "medewerker"].includes(profile.role)) {
    return { ok: false, error: "Geen toegang." };
  }

  const plate = normalizePlate(String(rawPlate || ""));
  if (plate.length < 6) return { ok: false, error: "Vul een volledig kenteken in." };
  if (plate.length > 8) return { ok: false, error: "Dit lijkt geen geldig kenteken." };

  try {
    const vehicle = await fetchRdwVehicle(plate);
    if (!vehicle) return { ok: false, error: `Kenteken ${plate} niet gevonden bij de RDW.` };
    return { ok: true, ...vehicle };
  } catch (e) {
    if (e instanceof RdwUnavailableError) {
      return { ok: false, error: "RDW is even niet bereikbaar. Vul de gegevens handmatig in." };
    }
    return { ok: false, error: "Kentekencheck mislukt. Vul de gegevens handmatig in." };
  }
}

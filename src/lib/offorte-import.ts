// ============================================================
// Een gewonnen Offorte-offerte omzetten naar een project in het portaal.
//
// Uitgangspunt: alleen vullen wat de offerte echt bevat. Een veld dat in
// Offorte leeg is, blijft in het portaal leeg — er wordt niets verzonnen.
// Het kenteken komt alleen uit de offertenaam als de RDW 'm herkent.
// ============================================================

import { createAdminClient } from "@/lib/supabase/admin";
import { fetchRdwVehicle, RdwUnavailableError, type RdwVehicle } from "@/lib/rdw";
import {
  offorteFetch,
  mapCustomer,
  mapProject,
  rowsSummary,
  type OfforteProposal,
} from "@/lib/offorte";

export type ImportResult =
  | { status: "ok"; projectId: string; title: string }
  | { status: "overgeslagen"; projectId: string; message: string }
  | { status: "genegeerd"; message: string };

/**
 * Testfase: klanten mogen geen mail kunnen ontvangen. Het echte adres gaat
 * dan niet mee het portaal in — dat blijft in Offorte staan — en er komt een
 * aantoonbaar onbezorgbaar adres (.invalid is daar door RFC 2606 voor
 * gereserveerd) voor in de plaats. Zet OFFORTE_TEST_MODE=false om live te gaan.
 */
export function isTestMode(): boolean {
  return process.env.OFFORTE_TEST_MODE !== "false";
}

export function dummyEmail(contactId: number | null, proposalId: number | string): string {
  return `offorte-${contactId ?? proposalId}@jurgh.invalid`;
}

/** Eerste kandidaat uit de offertenaam die de RDW herkent. */
async function resolvePlate(candidates: string[]): Promise<RdwVehicle | null> {
  for (const candidate of candidates) {
    try {
      const vehicle = await fetchRdwVehicle(candidate);
      if (vehicle) return vehicle;
    } catch (e) {
      // RDW plat: dan maken we het project aan zonder voertuiggegevens in
      // plaats van met een verkeerd kenteken.
      if (e instanceof RdwUnavailableError) return null;
      throw e;
    }
  }
  return null;
}

export async function importWonProposal(proposalId: number | string): Promise<ImportResult> {
  const supabase = createAdminClient();
  const testMode = isTestMode();

  // 1. Al eerder binnengehaald? De webhook kan dubbel afgeleverd worden.
  const { data: existing } = await supabase
    .from("projects")
    .select("id, title")
    .eq("offorte_proposal_id", Number(proposalId))
    .maybeSingle();
  if (existing) {
    return {
      status: "overgeslagen",
      projectId: existing.id,
      message: `Offerte ${proposalId} hoort al bij project "${existing.title}".`,
    };
  }

  // 2. Offerte ophalen
  const proposal = await offorteFetch<OfforteProposal>(`proposals/${proposalId}/details`);
  if (proposal.status && proposal.status !== "won") {
    return { status: "genegeerd", message: `Offerte ${proposalId} heeft status ${proposal.status}.` };
  }

  const mappedCustomer = mapCustomer(proposal);
  const mapped = mapProject(proposal);

  // 3. Klant: eerst op het Offorte-contact, dan op e-mail (buiten de testfase,
  //    want in de testfase staat er een dummyadres in).
  let customerId: string | null = null;
  if (mappedCustomer.offorteContactId) {
    const { data } = await supabase
      .from("customers")
      .select("id")
      .eq("offorte_contact_id", mappedCustomer.offorteContactId)
      .maybeSingle();
    customerId = data?.id ?? null;
  }
  if (!customerId && !testMode && mappedCustomer.email) {
    const { data } = await supabase
      .from("customers")
      .select("id")
      .ilike("email", mappedCustomer.email)
      .maybeSingle();
    customerId = data?.id ?? null;
  }

  const email = testMode
    ? dummyEmail(mappedCustomer.offorteContactId, proposal.id)
    : mappedCustomer.email;

  if (!customerId) {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: mappedCustomer.name,
        email,
        phone: mappedCustomer.phone,
        is_business: mappedCustomer.isBusiness,
        company_name: mappedCustomer.companyName,
        offorte_contact_id: mappedCustomer.offorteContactId,
        // in de testfase staan herinneringen uit, zodat er niets naar de klant kan
        reminders_enabled: !testMode,
      })
      .select("id")
      .single();
    if (error) throw new Error(`Kon klant niet aanmaken: ${error.message}`);
    customerId = data.id;
  } else {
    // bestaande klant: alleen de koppeling bijwerken, verder niets overschrijven
    await supabase
      .from("customers")
      .update({ offorte_contact_id: mappedCustomer.offorteContactId })
      .eq("id", customerId)
      .is("offorte_contact_id", null);
  }

  // 4. Auto: alleen als de RDW het kenteken uit de offertenaam herkent.
  const rdw = await resolvePlate(mapped.plateCandidates);
  let vehicleId: string | null = null;

  if (rdw) {
    const { data: known } = await supabase
      .from("vehicles")
      .select("id")
      .eq("customer_id", customerId)
      .eq("license_plate", rdw.plate)
      .maybeSingle();
    vehicleId = known?.id ?? null;
  }

  if (!vehicleId) {
    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        customer_id: customerId,
        license_plate: rdw?.plate ?? null,
        make: rdw?.make ?? null,
        model: rdw?.model ?? null,
        year: rdw?.year ?? null,
        color: rdw?.color ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(`Kon auto niet aanmaken: ${error.message}`);
    vehicleId = data.id;
  }

  // 5. Project
  const summary = rowsSummary(mapped.acceptedRows);
  const herkomst = [
    `Automatisch aangemaakt uit Offorte${mapped.proposalNr ? ` (${mapped.proposalNr.trim()})` : ""}.`,
    proposal.date_won ? `Geaccordeerd op ${proposal.date_won.slice(0, 10)}.` : null,
    !rdw ? "Kenteken stond niet in de offerte — auto nog aanvullen." : null,
    summary ? `\nGeaccepteerde regels:\n${summary}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      customer_id: customerId,
      vehicle_id: vehicleId,
      title: mapped.title,
      type: mapped.type,
      status: "goedgekeurd",
      price: mapped.price,
      loaner_car: mapped.loanerCar,
      transport: mapped.transport,
      internal_notes: herkomst,
      offorte_proposal_id: Number(proposal.id),
      offorte_proposal_nr: mapped.proposalNr,
      offorte_proposal_url: mapped.proposalUrl,
    })
    .select("id, title")
    .single();

  if (error) {
    // De unieke index kan toeslaan als twee afleveringen tegelijk binnenkomen.
    if (error.code === "23505") {
      const { data: race } = await supabase
        .from("projects")
        .select("id, title")
        .eq("offorte_proposal_id", Number(proposal.id))
        .maybeSingle();
      if (race) {
        return {
          status: "overgeslagen",
          projectId: race.id,
          message: `Offerte ${proposalId} was al binnengehaald.`,
        };
      }
    }
    throw new Error(`Kon project niet aanmaken: ${error.message}`);
  }

  return { status: "ok", projectId: project.id, title: project.title };
}

/** Logregel wegschrijven; mag de afhandeling nooit laten klappen. */
export async function logOfforteEvent(entry: {
  eventType: string;
  proposalId?: number | string | null;
  status: "ok" | "overgeslagen" | "genegeerd" | "fout";
  message?: string | null;
  projectId?: string | null;
}) {
  try {
    const supabase = createAdminClient();
    await supabase.from("offorte_events").insert({
      event_type: entry.eventType,
      proposal_id: entry.proposalId != null ? Number(entry.proposalId) : null,
      status: entry.status,
      message: entry.message ?? null,
      project_id: entry.projectId ?? null,
    });
  } catch {
    // logboek is bijvangst, geen reden om de webhook te laten falen
  }
}

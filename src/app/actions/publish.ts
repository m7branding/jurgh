"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth";
import { isMailDryRun, emailProblem } from "@/lib/publish-rules";

// ============================================================
// Publiceren: vanaf hier mag de klant zijn project zien.
//
// Publiceren staat los van de projectstatus en doet drie dingen:
//   1. zorgt dat er een klantaccount bestaat voor het e-mailadres
//   2. koppelt dat account aan het klantrecord (profile_id)
//   3. zet published_at, waarna RLS het project vrijgeeft
//
// Verzenden gebeurt (nog) niet: de inloglink wordt gelogd in
// portal_invites, zodat de hele flow te testen is zonder mailserver.
// Zie PORTAL_MAIL_DRY_RUN.
// ============================================================

async function adminOnly() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") throw new Error("Alleen admin");
  return profile;
}

/** Bestaand auth-account zoeken op e-mailadres. */
async function findUserByEmail(
  supabase: ReturnType<typeof createAdminClient>,
  email: string
): Promise<string | null> {
  const target = email.toLowerCase();
  // listUsers pagineert; bij de aantallen hier is één pagina ruim genoeg,
  // maar we lopen door tot we 'm hebben of de lijst op is.
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) return null;
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === target);
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

export type PublishResult = { error?: string; ok?: boolean; dryRun?: boolean };

export async function publishProject(_prev: unknown, formData: FormData): Promise<PublishResult> {
  const profile = await adminOnly();
  const supabase = createAdminClient();
  const projectId = String(formData.get("project_id") || "");

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, published_at, customer_id, customers:customer_id(id, name, email, profile_id)")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return { error: "Project niet gevonden." };
  if (project.published_at) return { error: "Dit project is al gepubliceerd." };

  const customer = project.customers as unknown as {
    id: string;
    name: string;
    email: string | null;
    profile_id: string | null;
  } | null;
  if (!customer) return { error: "Dit project heeft geen klant." };

  const probleem = emailProblem(customer.email);
  if (probleem) return { error: probleem };
  const email = String(customer.email).trim();

  // ---------- 1. account ----------
  let profileId = customer.profile_id;
  const eersteKeer = !profileId;

  if (!profileId) {
    profileId = await findUserByEmail(supabase, email);
  }

  if (!profileId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true, // geen bevestigingsmail; de inloglink is de bevestiging
      user_metadata: { role: "klant", full_name: customer.name },
    });
    if (error || !data.user) {
      return { error: `Kon klantaccount niet aanmaken: ${error?.message ?? "onbekende fout"}` };
    }
    profileId = data.user.id;
  }

  // rol borgen (de trigger zet 'm bij aanmaken, dit dekt bestaande accounts)
  await supabase
    .from("profiles")
    .upsert({ id: profileId, role: "klant", full_name: customer.name }, { onConflict: "id" });

  // ---------- 2. koppelen ----------
  if (customer.profile_id !== profileId) {
    const { error } = await supabase
      .from("customers")
      .update({ profile_id: profileId })
      .eq("id", customer.id);
    if (error) return { error: `Kon klant niet koppelen: ${error.message}` };
  }

  // ---------- 3. inloglink of melding ----------
  const kind = eersteKeer ? "uitnodiging" : "melding";
  let actionLink: string | null = null;
  let melding: string;

  if (eersteKeer) {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (error) return { error: `Kon inloglink niet maken: ${error.message}` };
    actionLink = data.properties?.action_link ?? null;
    melding = `Uitnodiging voor ${customer.name} — project "${project.title}".`;
  } else {
    melding = `Melding voor ${customer.name}: project "${project.title}" staat klaar in het dossier.`;
  }

  if (!isMailDryRun()) {
    // Bewust niet half gebouwd: zolang er geen mailprovider is ingericht,
    // wordt er niets verstuurd en zegt het logboek precies dat.
    await supabase.from("portal_invites").insert({
      customer_id: customer.id,
      project_id: project.id,
      email,
      kind,
      status: "fout",
      message: "PORTAL_MAIL_DRY_RUN staat uit, maar er is nog geen mailprovider ingericht.",
      created_by: profile.id,
    });
    return { error: "Mailverzending is nog niet ingericht. Zet PORTAL_MAIL_DRY_RUN weer aan." };
  }

  await supabase.from("portal_invites").insert({
    customer_id: customer.id,
    project_id: project.id,
    email,
    kind,
    status: "drooggelogd",
    action_link: actionLink,
    message: melding,
    created_by: profile.id,
  });

  // ---------- 4. vrijgeven ----------
  const { error } = await supabase
    .from("projects")
    .update({ published_at: new Date().toISOString(), published_by: profile.id })
    .eq("id", project.id);
  if (error) return { error: `Kon project niet publiceren: ${error.message}` };

  refresh(project.id);
  return { ok: true, dryRun: true };
}

export async function unpublishProject(formData: FormData) {
  await adminOnly();
  const supabase = createAdminClient();
  const projectId = String(formData.get("project_id") || "");

  const { error } = await supabase
    .from("projects")
    .update({ published_at: null, published_by: null })
    .eq("id", projectId);
  if (error) throw new Error(error.message);

  refresh(projectId);
}

/** E-mailadres van een klant bijwerken (nodig om te kunnen publiceren). */
export async function updateCustomerEmail(formData: FormData) {
  await adminOnly();
  const supabase = createAdminClient();
  const customerId = String(formData.get("customer_id") || "");
  const email = String(formData.get("email") || "").trim();

  const { error } = await supabase
    .from("customers")
    .update({ email: email || null })
    .eq("id", customerId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/klanten");
}

function refresh(projectId: string) {
  revalidatePath(`/admin/projecten/${projectId}`);
  revalidatePath(`/klant/dossier/${projectId}`);
  revalidatePath("/admin/projecten");
  revalidatePath("/admin/uitnodigingen");
  revalidatePath("/admin");
  revalidatePath("/klant");
}

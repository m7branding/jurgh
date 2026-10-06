"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

// ============================================================
// Acties die de klant zelf uitvoert in zijn dossier.
//
// Alle schrijfacties lopen via security-definer functies in de database:
// de klant heeft zelf geen schrijfrechten op projects of extra_work, en
// die functies controleren eerst of het project van hem is én gepubliceerd.
// ============================================================

function refresh(projectId: string) {
  revalidatePath(`/klant/dossier/${projectId}`);
  revalidatePath(`/admin/projecten/${projectId}`);
  revalidatePath("/klant");
}

/** Leenauto of transport aanvragen. De admin kent het daarna toe. */
export async function requestProjectOption(formData: FormData) {
  const supabase = createClient();
  const projectId = String(formData.get("project_id") || "");
  const kind = String(formData.get("kind") || "");

  const { error } = await supabase.rpc("request_project_option", {
    p_project_id: projectId,
    p_kind: kind,
  });
  if (error) throw new Error(error.message);
  refresh(projectId);
}

/** Een optie uit de catalogus aanvragen; komt binnen als 'aangevraagd'. */
export async function requestCatalogItem(formData: FormData) {
  const supabase = createClient();
  const projectId = String(formData.get("project_id") || "");
  const catalogId = String(formData.get("catalog_id") || "");

  const { error } = await supabase.rpc("request_catalog_item", {
    p_project_id: projectId,
    p_catalog_id: catalogId,
  });
  if (error) throw new Error(error.message);
  refresh(projectId);
}

/**
 * Welkomstscherm afvinken. 0 → eerste keer, 1 → tweede keer, daarna niets.
 * De klant mag zijn eigen profiel bijwerken (RLS: profiles_self_update).
 */
export async function markWelcomeSeen() {
  const profile = await getSessionProfile();
  if (!profile) return;

  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("welcome_seen_count")
    .eq("id", profile.id)
    .maybeSingle();

  const seen = Number(data?.welcome_seen_count ?? 0);
  if (seen >= 2) return;

  await supabase
    .from("profiles")
    .update({ welcome_seen_count: seen + 1 })
    .eq("id", profile.id);
}

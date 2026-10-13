"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { normaliseerPlan } from "@/lib/plan";

/**
 * Links per dienst: één keer invullen, elk project van dat type toont ze.
 * Alleen admin; RLS bewaakt het ook nog eens aan de databasekant.
 */
export async function updateServiceLink(formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") throw new Error("Alleen admin");

  const supabase = createClient();
  const projectType = String(formData.get("project_type") || "");
  const website = String(formData.get("website_url") || "").trim();
  const plan = String(formData.get("plan_url") || "").trim();

  const { error } = await supabase
    .from("service_links")
    .update({
      website_url: website || null,
      plan_url: plan || null,
      updated_at: new Date().toISOString(),
    })
    .eq("project_type", projectType);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/diensten");
}

/**
 * Standaardtekst van het plan van aanpak voor één dienst. Eén stap per regel,
 * "Titel — uitleg". Projecten zonder eigen tekst tonen deze aan de klant.
 */
export async function updateServicePlan(formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") throw new Error("Alleen admin");

  const supabase = createClient();
  const projectType = String(formData.get("project_type") || "");
  const tekst = normaliseerPlan(String(formData.get("plan_text") || ""));

  const { error } = await supabase
    .from("service_links")
    .update({ plan_text: tekst || null, updated_at: new Date().toISOString() })
    .eq("project_type", projectType);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/diensten");
}

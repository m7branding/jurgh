"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

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
 * Stappen van het plan van aanpak voor één dienst. Eén stap per regel; de
 * volgorde van de regels is de volgorde van de stappen.
 */
export async function updateServiceMilestones(formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") throw new Error("Alleen admin");

  const supabase = createClient();
  const projectType = String(formData.get("project_type") || "");
  const stappen = String(formData.get("milestones") || "")
    .split("\n")
    .map((regel) => regel.trim())
    .filter(Boolean);

  const { error: delError } = await supabase
    .from("service_milestones")
    .delete()
    .eq("project_type", projectType);
  if (delError) throw new Error(delError.message);

  if (stappen.length > 0) {
    const { error } = await supabase.from("service_milestones").insert(
      stappen.map((title, i) => ({ project_type: projectType, position: i + 1, title }))
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/diensten");
}

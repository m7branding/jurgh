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

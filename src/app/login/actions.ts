"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/auth";
import type { Role } from "@/lib/constants";
import { isDemoAccount } from "@/lib/demo";

export async function signIn(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Vul je e-mailadres en wachtwoord in." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Onjuiste inloggegevens. Probeer het opnieuw." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: Role = "klant";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role) role = profile.role as Role;

    // demo-account: bij elke login weer het welkomstscherm van de eerste keer
    if (isDemoAccount(user.email)) {
      await supabase.from("profiles").update({ welcome_seen_count: 0 }).eq("id", user.id);
    }
  }

  redirect(homePathForRole(role));
}

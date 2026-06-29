import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/constants";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  phone: string | null;
};

/** Haalt de ingelogde gebruiker + profiel op, of null. */
export async function getSessionProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { id: user.id, role: "klant", full_name: "", phone: null };
  }
  return profile as Profile;
}

/** Vereist login; stuurt anders naar /login. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Vereist een specifieke rol (of een van meerdere). */
export async function requireRole(roles: Role[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) {
    redirect(homePathForRole(profile.role));
  }
  return profile;
}

export function homePathForRole(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "medewerker":
      return "/medewerker";
    default:
      return "/klant";
  }
}

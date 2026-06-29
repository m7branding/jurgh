import { redirect } from "next/navigation";
import { getSessionProfile, homePathForRole } from "@/lib/auth";

// Geen aparte landingspagina meer: meteen door naar login of de juiste omgeving.
export default async function HomePage() {
  const profile = await getSessionProfile();
  if (profile) redirect(homePathForRole(profile.role));
  redirect("/login");
}

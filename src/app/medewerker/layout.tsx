import { requireRole } from "@/lib/auth";
import { PortalShell, type NavItem } from "@/components/PortalShell";

const nav: NavItem[] = [{ href: "/medewerker", label: "Mijn projecten" }];

export default async function MedewerkerLayout({ children }: { children: React.ReactNode }) {
  // admin mag ook in de werkomgeving kijken
  const profile = await requireRole(["medewerker", "admin"]);
  return (
    <PortalShell role={profile.role} name={profile.full_name} nav={nav}>
      {children}
    </PortalShell>
  );
}

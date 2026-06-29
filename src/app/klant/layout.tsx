import { requireRole } from "@/lib/auth";
import { PortalShell, type NavItem } from "@/components/PortalShell";

const nav: NavItem[] = [{ href: "/klant", label: "Mijn dashboard" }];

export default async function KlantLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["klant"]);
  return (
    <PortalShell role="klant" name={profile.full_name} nav={nav}>
      {children}
    </PortalShell>
  );
}

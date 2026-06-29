import { requireRole } from "@/lib/auth";
import { PortalShell, type NavItem } from "@/components/PortalShell";

const nav: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/projecten", label: "Projecten" },
  { href: "/admin/projecten/nieuw", label: "Nieuw project" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["admin"]);
  return (
    <PortalShell role="admin" name={profile.full_name} nav={nav}>
      {children}
    </PortalShell>
  );
}

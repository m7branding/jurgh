import Link from "next/link";
import { Logo, Badge } from "@/components/ui";
import type { Role } from "@/lib/constants";

export type NavItem = { href: string; label: string };

const roleLabel: Record<Role, string> = {
  admin: "Admin",
  medewerker: "Medewerker",
  klant: "Klant",
};

export function PortalShell({
  role,
  name,
  nav,
  theme = "dark",
  children,
}: {
  role: Role;
  name: string;
  nav: NavItem[];
  theme?: "light" | "dark";
  children: React.ReactNode;
}) {
  return (
    <div data-theme={theme} className="min-h-screen bg-jurgh-black text-jurgh-text">
      <header className="sticky top-0 z-30 border-b border-jurgh-border bg-jurgh-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href={nav[0]?.href ?? "/"}>
              <Logo />
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-jurgh-muted transition hover:bg-jurgh-text/5 hover:text-jurgh-text"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-jurgh-text">{name || "Gebruiker"}</p>
              <Badge tone={role === "klant" ? "neutral" : "red"}>{roleLabel[role]}</Badge>
            </div>
            <form action="/auth/signout" method="post">
              <button className="btn-ghost px-3 py-1.5" type="submit">
                Uitloggen
              </button>
            </form>
          </div>
        </div>

        {/* mobiele nav */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-jurgh-border px-4 py-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-jurgh-muted hover:text-jurgh-text"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

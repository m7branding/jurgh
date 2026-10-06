"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { toggleCustomerReminders } from "@/app/actions/projects";
import { updateCustomerEmail } from "@/app/actions/publish";

type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  is_business: boolean;
  reminders_enabled: boolean;
  vehicles: { id: string; license_plate: string; make: string | null; model: string | null }[];
  projects: { id: string; status: string }[];
};

export function CustomerList({ customers }: { customers: CustomerRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.email, c.phone, c.company_name].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q))
    );
  }, [customers, query]);

  return (
    <div className="space-y-4">
      <input
        className="input max-w-sm"
        placeholder="Zoek op naam, e-mail, telefoon of bedrijf…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-jurgh-muted">Geen klanten gevonden.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-jurgh-muted">
                <th className="py-2 pr-3">Klant</th>
                <th className="py-2 pr-3">Contact</th>
                <th className="py-2 pr-3">Auto's</th>
                <th className="py-2 pr-3">Projecten</th>
                <th className="py-2 pr-3">Herinneringen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-jurgh-border align-top">
                  <td className="py-2.5 pr-3">
                    <p className="font-medium text-jurgh-text">{c.name}</p>
                    {c.is_business && <Badge tone="neutral">{c.company_name || "Zakelijk"}</Badge>}
                  </td>
                  <td className="py-2.5 pr-3 text-jurgh-muted">
                    {/* e-mailadres is bewerkbaar: publiceren kan niet met een testadres */}
                    <form action={updateCustomerEmail} className="flex items-center gap-1">
                      <input type="hidden" name="customer_id" value={c.id} />
                      <input
                        name="email"
                        type="email"
                        defaultValue={c.email ?? ""}
                        placeholder="geen e-mailadres"
                        className="input max-w-[220px] px-2 py-1 text-xs"
                      />
                      <button type="submit" className="btn-ghost px-2 py-1 text-xs">
                        Opslaan
                      </button>
                    </form>
                    {c.email && /\.invalid$/i.test(c.email) && (
                      <p className="mt-1 text-xs text-jurgh-gold">Testadres — publiceren lukt hiermee niet</p>
                    )}
                    {c.phone && <div className="mt-1">{c.phone}</div>}
                  </td>
                  <td className="py-2.5 pr-3 text-jurgh-muted">
                    {c.vehicles.length === 0
                      ? "—"
                      : c.vehicles.map((v) => (
                          <Link
                            key={v.id}
                            href={`/admin/autos/${v.id}`}
                            className="block hover:text-jurgh-red hover:underline"
                          >
                            {[v.make, v.model].filter(Boolean).join(" ") || v.license_plate}
                          </Link>
                        ))}
                  </td>
                  <td className="py-2.5 pr-3 text-jurgh-muted">{c.projects.length}</td>
                  <td className="py-2.5 pr-3">
                    <form action={toggleCustomerReminders}>
                      <input type="hidden" name="customer_id" value={c.id} />
                      <input type="hidden" name="enabled" value={(!c.reminders_enabled).toString()} />
                      <button
                        type="submit"
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          c.reminders_enabled
                            ? "bg-jurgh-green/15 text-jurgh-green"
                            : "bg-white/5 text-jurgh-muted"
                        }`}
                      >
                        {c.reminders_enabled ? "Aan" : "Uit"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

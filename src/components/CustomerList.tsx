"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { toggleCustomerReminders } from "@/app/actions/projects";

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
                    {c.email && <div>{c.email}</div>}
                    {c.phone && <div>{c.phone}</div>}
                    {!c.email && !c.phone && "—"}
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

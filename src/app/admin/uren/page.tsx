import Link from "next/link";
import { listAllWorkLogs } from "@/lib/data";
import { StatCard, SectionTitle, EmptyState } from "@/components/ui";
import { WORK_TYPE_LABEL, formatDate, type WorkType } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminUrenPage() {
  const logs = (await listAllWorkLogs()) as any[];

  const totalHours = logs.reduce((s, l) => s + Number(l.hours || 0), 0);

  // Totalen per medewerker
  const perEmployee = new Map<string, number>();
  for (const l of logs) {
    const name = l.profiles?.full_name || "Onbekend";
    perEmployee.set(name, (perEmployee.get(name) || 0) + Number(l.hours || 0));
  }
  const employees = [...perEmployee.entries()].sort((a, b) => b[1] - a[1]);

  // Totalen per werkzaamheidstype
  const perType = new Map<string, number>();
  for (const l of logs) {
    const t = WORK_TYPE_LABEL[l.work_type as WorkType] || l.work_type;
    perType.set(t, (perType.get(t) || 0) + Number(l.hours || 0));
  }
  const types = [...perType.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-jurgh-text">Uren &amp; werkzaamheden</h1>
        <p className="text-jurgh-muted">Volg alle gelogde uren per medewerker, auto en type.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Totaal gelogde uren" value={`${totalHours.toFixed(2)} u`} accent />
        <StatCard label="Aantal logs" value={logs.length} />
        <StatCard label="Medewerkers actief" value={employees.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <SectionTitle>Uren per medewerker</SectionTitle>
          {employees.length === 0 ? (
            <p className="text-sm text-jurgh-muted">Nog geen uren gelogd.</p>
          ) : (
            <ul className="space-y-2">
              {employees.map(([name, hours]) => (
                <li key={name} className="flex items-center justify-between text-sm">
                  <span className="text-jurgh-text">{name}</span>
                  <span className="font-semibold text-jurgh-text">{hours.toFixed(2)} u</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <SectionTitle>Uren per werkzaamheid</SectionTitle>
          {types.length === 0 ? (
            <p className="text-sm text-jurgh-muted">Nog geen uren gelogd.</p>
          ) : (
            <ul className="space-y-2">
              {types.map(([t, hours]) => (
                <li key={t} className="flex items-center justify-between text-sm">
                  <span className="text-jurgh-text">{t}</span>
                  <span className="font-semibold text-jurgh-text">{hours.toFixed(2)} u</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-6">
        <SectionTitle>Alle logs</SectionTitle>
        {logs.length === 0 ? (
          <EmptyState title="Nog geen werkzaamheden gelogd" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-jurgh-muted">
                  <th className="py-2 pr-3">Datum</th>
                  <th className="py-2 pr-3">Medewerker</th>
                  <th className="py-2 pr-3">Auto</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Uren</th>
                  <th className="py-2">Omschrijving</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => {
                  const veh = l.projects?.vehicles;
                  const carLabel = veh
                    ? `${[veh.make, veh.model].filter(Boolean).join(" ")} (${veh.license_plate})`
                    : "—";
                  return (
                    <tr key={l.id} className="border-t border-jurgh-border">
                      <td className="py-2 pr-3 text-jurgh-muted">{formatDate(l.log_date)}</td>
                      <td className="py-2 pr-3 text-jurgh-text">{l.profiles?.full_name ?? "—"}</td>
                      <td className="py-2 pr-3 text-jurgh-muted">
                        {l.projects?.id ? (
                          <Link href={`/admin/projecten/${l.projects.id}`} className="hover:text-jurgh-red">
                            {carLabel}
                          </Link>
                        ) : (
                          carLabel
                        )}
                      </td>
                      <td className="py-2 pr-3">{WORK_TYPE_LABEL[l.work_type as WorkType]}</td>
                      <td className="py-2 pr-3 font-semibold text-jurgh-text">{Number(l.hours).toFixed(2)}</td>
                      <td className="py-2 text-jurgh-muted">{l.description ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

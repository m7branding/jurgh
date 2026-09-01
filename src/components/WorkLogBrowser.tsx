"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatCard, SectionTitle, EmptyState, Plate } from "@/components/ui";
import { WORK_TYPES, WORK_TYPE_LABEL, formatDate, type WorkType } from "@/lib/constants";

export type WorkLogRow = {
  id: string;
  log_date: string;
  work_type: string;
  hours: number | string;
  description: string | null;
  employee_id: string | null;
  profiles?: { full_name: string | null } | null;
  projects?: {
    id?: string;
    title?: string | null;
    vehicles?: { license_plate: string | null; make: string | null; model: string | null } | null;
    customers?: { name: string | null } | null;
  } | null;
};

type Period = "alles" | "vandaag" | "week" | "maand" | "aangepast";

const PERIODS: { value: Period; label: string }[] = [
  { value: "alles", label: "Alle periodes" },
  { value: "vandaag", label: "Vandaag" },
  { value: "week", label: "Deze week" },
  { value: "maand", label: "Deze maand" },
  { value: "aangepast", label: "Eigen periode…" },
];

/** Lokale datum als YYYY-MM-DD (log_date staat er ook zo in). */
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfWeek(now: Date): string {
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // 0 = maandag
  return isoDate(monday);
}

function carLabel(log: WorkLogRow): string {
  const v = log.projects?.vehicles;
  if (!v) return "—";
  const name = [v.make, v.model].filter(Boolean).join(" ");
  return name || v.license_plate || "Auto zonder kenteken";
}

function csvCell(value: unknown): string {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

export function WorkLogBrowser({ logs }: { logs: WorkLogRow[] }) {
  const [employee, setEmployee] = useState("");
  const [workType, setWorkType] = useState("");
  const [period, setPeriod] = useState<Period>("alles");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");

  // medewerkers uit de logs zelf, zodat de lijst altijd klopt met de data
  const employees = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of logs) {
      const key = l.employee_id || l.profiles?.full_name || "onbekend";
      map.set(key, l.profiles?.full_name || "Onbekend");
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [logs]);

  const range = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "vandaag":
        return { from: isoDate(now), to: isoDate(now) };
      case "week":
        return { from: startOfWeek(now), to: isoDate(now) };
      case "maand":
        return { from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: isoDate(now) };
      case "aangepast":
        return { from: from || "", to: to || "" };
      default:
        return { from: "", to: "" };
    }
  }, [period, from, to]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (employee) {
        const key = l.employee_id || l.profiles?.full_name || "onbekend";
        if (key !== employee) return false;
      }
      if (workType && l.work_type !== workType) return false;
      if (range.from && l.log_date < range.from) return false;
      if (range.to && l.log_date > range.to) return false;
      if (q) {
        const text = [
          l.profiles?.full_name,
          l.projects?.title,
          l.projects?.customers?.name,
          l.projects?.vehicles?.license_plate,
          l.projects?.vehicles?.make,
          l.projects?.vehicles?.model,
          l.description,
          WORK_TYPE_LABEL[l.work_type as WorkType],
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [logs, employee, workType, range, query]);

  const totalHours = filtered.reduce((s, l) => s + Number(l.hours || 0), 0);

  const perEmployee = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of filtered) {
      const name = l.profiles?.full_name || "Onbekend";
      map.set(name, (map.get(name) || 0) + Number(l.hours || 0));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const perType = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of filtered) {
      const label = WORK_TYPE_LABEL[l.work_type as WorkType] || l.work_type;
      map.set(label, (map.get(label) || 0) + Number(l.hours || 0));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const filtersActive = Boolean(employee || workType || query || period !== "alles");

  function downloadCsv() {
    const header = [
      "Datum",
      "Medewerker",
      "Klant",
      "Auto",
      "Kenteken",
      "Project",
      "Werkzaamheid",
      "Uren",
      "Omschrijving",
    ];
    const rows = filtered.map((l) => [
      l.log_date,
      l.profiles?.full_name ?? "",
      l.projects?.customers?.name ?? "",
      carLabel(l),
      l.projects?.vehicles?.license_plate ?? "",
      l.projects?.title ?? "",
      WORK_TYPE_LABEL[l.work_type as WorkType] || l.work_type,
      String(Number(l.hours || 0).toFixed(2)).replace(".", ","),
      l.description ?? "",
    ]);

    // puntkomma + BOM zodat Excel (NL) het bestand meteen goed opent
    const csv =
      "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `uren-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      {/* ---------- filters ---------- */}
      <section className="card space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Medewerker</label>
            <select
              className="input"
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
            >
              <option value="">Alle medewerkers</option>
              {employees.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Werkzaamheid</label>
            <select className="input" value={workType} onChange={(e) => setWorkType(e.target.value)}>
              <option value="">Alle werkzaamheden</option>
              {WORK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Periode</label>
            <select
              className="input"
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Zoeken</label>
            <input
              className="input"
              placeholder="Auto, kenteken, klant of taak…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {period === "aangepast" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:max-w-md">
            <div>
              <label className="label">Van</label>
              <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="label">Tot en met</label>
              <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 pt-1 text-sm text-jurgh-muted">
          <span>
            {filtered.length} van {logs.length} registraties
          </span>
          {filtersActive && (
            <button
              type="button"
              className="text-jurgh-red hover:underline"
              onClick={() => {
                setEmployee("");
                setWorkType("");
                setPeriod("alles");
                setFrom("");
                setTo("");
                setQuery("");
              }}
            >
              Filters wissen
            </button>
          )}
          <button
            type="button"
            className="ml-auto btn-ghost px-3 py-1.5 text-xs"
            onClick={downloadCsv}
            disabled={filtered.length === 0}
          >
            Download CSV
          </button>
        </div>
      </section>

      {/* ---------- totalen (volgen het filter) ---------- */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Gelogde uren" value={`${totalHours.toFixed(2)} u`} accent />
        <StatCard label="Aantal logs" value={filtered.length} />
        <StatCard label="Medewerkers" value={perEmployee.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <SectionTitle>Uren per medewerker</SectionTitle>
          {perEmployee.length === 0 ? (
            <p className="text-sm text-jurgh-muted">Geen uren binnen dit filter.</p>
          ) : (
            <ul className="space-y-2">
              {perEmployee.map(([name, hours]) => (
                <li key={name} className="flex items-center justify-between text-sm">
                  <span className="text-jurgh-text">{name}</span>
                  <span className="font-semibold tabular-nums text-jurgh-text">
                    {hours.toFixed(2)} u
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <SectionTitle>Uren per werkzaamheid</SectionTitle>
          {perType.length === 0 ? (
            <p className="text-sm text-jurgh-muted">Geen uren binnen dit filter.</p>
          ) : (
            <ul className="space-y-2">
              {perType.map(([label, hours]) => (
                <li key={label} className="flex items-center justify-between text-sm">
                  <span className="text-jurgh-text">{label}</span>
                  <span className="font-semibold tabular-nums text-jurgh-text">
                    {hours.toFixed(2)} u
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ---------- tabel ---------- */}
      <section className="card p-6">
        <SectionTitle>Registraties</SectionTitle>
        {filtered.length === 0 ? (
          <EmptyState
            title={logs.length === 0 ? "Nog geen werkzaamheden gelogd" : "Geen registraties binnen dit filter"}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-jurgh-muted">
                  <th className="py-2 pr-3">Datum</th>
                  <th className="py-2 pr-3">Medewerker</th>
                  <th className="py-2 pr-3">Auto</th>
                  <th className="py-2 pr-3">Kenteken</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Uren</th>
                  <th className="py-2">Omschrijving</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-t border-jurgh-border">
                    <td className="py-2 pr-3 text-jurgh-muted">{formatDate(l.log_date)}</td>
                    <td className="py-2 pr-3 text-jurgh-text">{l.profiles?.full_name ?? "—"}</td>
                    <td className="py-2 pr-3 text-jurgh-muted">
                      {l.projects?.id ? (
                        <Link
                          href={`/admin/projecten/${l.projects.id}`}
                          className="hover:text-jurgh-red"
                        >
                          {carLabel(l)}
                        </Link>
                      ) : (
                        carLabel(l)
                      )}
                    </td>
                    <td className="py-2 pr-3 text-jurgh-muted">
                      <Plate value={l.projects?.vehicles?.license_plate} />
                    </td>
                    <td className="py-2 pr-3">
                      {WORK_TYPE_LABEL[l.work_type as WorkType] || l.work_type}
                    </td>
                    <td className="py-2 pr-3 font-semibold tabular-nums text-jurgh-text">
                      {Number(l.hours || 0).toFixed(2)}
                    </td>
                    <td className="py-2 text-jurgh-muted">{l.description ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

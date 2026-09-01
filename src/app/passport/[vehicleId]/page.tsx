import Link from "next/link";
import { requireProfile, homePathForRole } from "@/lib/auth";
import { getVehiclePassport, vehicleTitle } from "@/lib/data";
import { projectTypeLabel, formatDate } from "@/lib/constants";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function PassportPage({ params }: { params: { vehicleId: string } }) {
  const profile = await requireProfile();
  const data = await getVehiclePassport(params.vehicleId);

  if (!data) {
    return (
      <main data-theme="light" className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-jurgh-text">Auto niet gevonden of geen toegang.</p>
        <Link href={homePathForRole(profile.role)} className="btn-ghost mt-4">
          Terug
        </Link>
      </main>
    );
  }

  const { vehicle, projects } = data as any;
  const customer = vehicle.customers;
  const certNo = `JURGH-${String(vehicle.id).slice(0, 8).toUpperCase()}`;
  const generated = formatDate(new Date().toISOString());

  return (
    <main data-theme="light" className="min-h-screen bg-jurgh-black px-4 py-8 sm:py-12">
      {/* actiebalk (niet meegeprint) */}
      <div className="no-print mx-auto mb-6 flex max-w-3xl items-center justify-between">
        <Link href={homePathForRole(profile.role)} className="btn-ghost">
          ← Terug
        </Link>
        <PrintButton />
      </div>

      {/* certificaat */}
      <article className="passport mx-auto max-w-3xl overflow-hidden rounded-2xl border border-jurgh-border bg-white shadow-card">
        <header className="flex items-start justify-between gap-4 border-b-4 border-jurgh-red px-8 py-7">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/JURGH-Logo2.svg" alt="JURGH" className="h-9 w-auto" />
            <h1 className="mt-3 text-2xl font-black tracking-tight text-[#111]">
              Detailing Passport
            </h1>
            <p className="text-sm font-medium text-jurgh-red">Vehicle Care &amp; Treatment Report</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p className="font-semibold text-[#111]">Certificaatnr.</p>
            <p className="font-mono">{certNo}</p>
            <p className="mt-2 font-semibold text-[#111]">Afgegeven</p>
            <p>{generated}</p>
          </div>
        </header>

        <div className="grid gap-6 px-8 py-6 sm:grid-cols-2">
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Voertuig</h2>
            <p className="text-lg font-bold text-[#111]">{vehicleTitle(vehicle)}</p>
            {vehicle.license_plate ? (
              <p className="font-mono text-sm uppercase text-gray-600">{vehicle.license_plate}</p>
            ) : (
              <p className="text-sm italic text-gray-500">Kenteken onbekend</p>
            )}
            <dl className="mt-2 space-y-0.5 text-sm text-gray-600">
              {vehicle.year && <div>Bouwjaar: {vehicle.year}</div>}
              {vehicle.color && <div>Kleur: {vehicle.color}</div>}
              {vehicle.mileage != null && (
                <div>Km-stand: {Number(vehicle.mileage).toLocaleString("nl-NL")}</div>
              )}
            </dl>
          </section>
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Eigenaar</h2>
            <p className="text-lg font-bold text-[#111]">{customer?.name ?? "—"}</p>
            {customer?.email && <p className="text-sm text-gray-600">{customer.email}</p>}
            {customer?.phone && <p className="text-sm text-gray-600">{customer.phone}</p>}
          </section>
        </div>

        <div className="px-8 pb-2">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
            Uitgevoerde behandelingen bij JURGH
          </h2>
          {projects.length === 0 ? (
            <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              Nog geen afgeronde behandelingen voor dit voertuig.
            </p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-400">
                  <th className="py-2 pr-3">Datum</th>
                  <th className="py-2 pr-3">Behandeling</th>
                  <th className="py-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p: any) => (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="py-2.5 pr-3 align-top text-gray-600">
                      {formatDate(p.completed_at || p.appointment_date || p.created_at)}
                    </td>
                    <td className="py-2.5 pr-3 align-top font-medium text-[#111]">{p.title}</td>
                    <td className="py-2.5 align-top text-gray-600">
                      {projectTypeLabel(p.type)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <footer className="mt-4 border-t border-gray-200 px-8 py-5 text-xs leading-relaxed text-gray-500">
          <p>
            Dit Detailing Passport is een overzicht van de behandelingen die door JURGH Car
            Detailing aan bovenstaand voertuig zijn uitgevoerd. Het dient als bewijs van
            professioneel onderhoud en bescherming (detailing, glascoating en Paint Protection
            Film) en kan worden overgedragen bij verkoop van het voertuig.
          </p>
          <p className="mt-2 font-semibold text-[#111]">JURGH Car Detailing — Detailing Portal</p>
        </footer>
      </article>
    </main>
  );
}

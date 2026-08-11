import { requireProfile } from "@/lib/auth";
import { listProjects, getEmployeeHours, vehicleTitle } from "@/lib/data";
import { ProjectCard } from "@/components/ProjectCard";
import { SectionTitle, EmptyState, ProgressBar } from "@/components/ui";
import { QuickLogFab } from "@/components/forms/QuickLogFab";

export const dynamic = "force-dynamic";

const DAY_TARGET = 8; // streefuren per dag voor de voortgangsbalk

export default async function MedewerkerHome() {
  const profile = await requireProfile();
  const [projects, hours] = await Promise.all([
    listProjects(),
    getEmployeeHours(profile.id),
  ]);

  const active = projects.filter(
    (p) => !["afgerond", "gefactureerd", "gearchiveerd"].includes(p.status)
  );

  const logOptions = active.map((p) => ({
    id: p.id,
    label: `${vehicleTitle(p.vehicles)} — ${p.vehicles?.license_plate ?? ""}${
      p.customers ? ` (${p.customers.name})` : ""
    }`,
  }));

  const dayPct = Math.min(100, Math.round((hours.today / DAY_TARGET) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-jurgh-text">Mijn projecten</h1>
        <p className="text-jurgh-muted">Werkomgeving — log uren, foto's en bijzonderheden.</p>
      </div>

      {/* Dag/week-overzicht van eigen gelogde uren */}
      <section className="card p-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-jurgh-muted">Vandaag gelogd</p>
            <p className="text-3xl font-black text-jurgh-text">
              {hours.today.toFixed(2)} <span className="text-lg font-semibold text-jurgh-muted">u</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-jurgh-muted">Deze week</p>
            <p className="text-xl font-bold text-jurgh-text">{hours.week.toFixed(2)} u</p>
          </div>
        </div>
        <ProgressBar value={dayPct} />
        <p className="mt-2 text-xs text-jurgh-muted">
          {dayPct}% van een werkdag ({DAY_TARGET} u) gelogd
        </p>
      </section>

      <SectionTitle>Lopende projecten</SectionTitle>
      {active.length === 0 ? (
        <EmptyState title="Geen lopende projecten" description="Er staan momenteel geen actieve projecten klaar." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              href={`/medewerker/projecten/${p.id}`}
              cta="Aan de slag"
              mode="medewerker"
            />
          ))}
        </div>
      )}

      {/* Zwevende snelknop om direct uren te loggen */}
      {logOptions.length > 0 && <QuickLogFab projects={logOptions} />}
    </div>
  );
}

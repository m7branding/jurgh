import { listProjects, vehicleTitle } from "@/lib/data";
import { ProjectCard } from "@/components/ProjectCard";
import { SectionTitle, EmptyState } from "@/components/ui";
import { QuickLogFab } from "@/components/forms/QuickLogFab";

export const dynamic = "force-dynamic";

export default async function MedewerkerHome() {
  const projects = await listProjects();
  const active = projects.filter(
    (p) => !["afgerond", "gefactureerd", "gearchiveerd"].includes(p.status)
  );

  const logOptions = active.map((p) => ({
    id: p.id,
    label: `${vehicleTitle(p.vehicles)} — ${p.vehicles?.license_plate ?? ""}${
      p.customers ? ` (${p.customers.name})` : ""
    }`,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-jurgh-text">Mijn projecten</h1>
        <p className="text-jurgh-muted">Werkomgeving — log uren, foto's en bijzonderheden.</p>
      </div>

      <SectionTitle>Lopende projecten</SectionTitle>
      {active.length === 0 ? (
        <EmptyState title="Geen lopende projecten" description="Er staan momenteel geen actieve projecten klaar." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((p) => (
            <ProjectCard key={p.id} project={p} href={`/medewerker/projecten/${p.id}`} cta="Aan de slag" />
          ))}
        </div>
      )}

      {/* Zwevende snelknop om direct uren te loggen */}
      {logOptions.length > 0 && <QuickLogFab projects={logOptions} />}
    </div>
  );
}

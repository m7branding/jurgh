import { listProjects } from "@/lib/data";
import { ProjectCard } from "@/components/ProjectCard";
import { SectionTitle, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MedewerkerHome() {
  const projects = await listProjects();
  const active = projects.filter(
    (p) => !["afgerond", "gefactureerd", "gearchiveerd"].includes(p.status)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mijn projecten</h1>
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
    </div>
  );
}

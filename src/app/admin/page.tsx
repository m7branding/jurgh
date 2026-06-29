import Link from "next/link";
import { listProjects } from "@/lib/data";
import { ProjectCard } from "@/components/ProjectCard";
import { StatCard, SectionTitle, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const projects = await listProjects();
  const active = projects.filter(
    (p) => !["afgerond", "gefactureerd", "gearchiveerd"].includes(p.status)
  );
  const done = projects.filter((p) => ["afgerond", "gefactureerd"].includes(p.status));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin dashboard</h1>
          <p className="text-jurgh-muted">Overzicht van alle projecten en activiteit.</p>
        </div>
        <Link href="/admin/projecten/nieuw" className="btn-primary">
          + Nieuw project
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Lopende projecten" value={active.length} accent />
        <StatCard label="Afgerond" value={done.length} />
        <StatCard label="Totaal projecten" value={projects.length} />
      </div>

      <section>
        <SectionTitle action={<Link href="/admin/projecten" className="text-sm text-jurgh-red hover:underline">Alle projecten →</Link>}>
          Lopende projecten
        </SectionTitle>
        {active.length === 0 ? (
          <EmptyState
            title="Nog geen lopende projecten"
            description="Maak je eerste project aan om te starten."
            action={<Link href="/admin/projecten/nieuw" className="btn-primary">+ Nieuw project</Link>}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((p) => (
              <ProjectCard key={p.id} project={p} href={`/admin/projecten/${p.id}`} cta="Open project" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

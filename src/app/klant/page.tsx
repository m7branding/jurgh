import { requireProfile } from "@/lib/auth";
import { listProjects } from "@/lib/data";
import { ProjectCard } from "@/components/ProjectCard";
import { StatCard, SectionTitle, EmptyState } from "@/components/ui";
import { RewardsPanel } from "@/components/RewardsPanel";

export const dynamic = "force-dynamic";

export default async function KlantDashboard() {
  const profile = await requireProfile();
  const projects = await listProjects(); // RLS: alleen eigen projecten

  const active = projects.filter(
    (p) => !["afgerond", "gefactureerd", "gearchiveerd"].includes(p.status)
  );
  const done = projects.filter((p) => ["afgerond", "gefactureerd"].includes(p.status));

  // Basis spaarsysteem: 1 punt per bestede euro op afgeronde projecten.
  const points = Math.round(
    done.reduce((s, p) => s + Number(p.price ?? 0) - Number(p.discount ?? 0), 0)
  );

  const firstName = profile.full_name?.split(" ")[0] || "daar";

  return (
    <div className="space-y-8">
      {/* Welkomstblok */}
      <div className="card relative overflow-hidden p-8">
        <div className="relative z-10">
          <p className="text-sm uppercase tracking-wide text-jurgh-red">JURGH Car Dossier</p>
          <h1 className="mt-1 text-3xl font-black text-jurgh-text">Welkom terug, {firstName}</h1>
          <p className="mt-2 max-w-lg text-jurgh-muted">
            Hier volg je live de voortgang van je auto: behandelingen, foto's vanuit de
            werkplaats en al je documenten op één plek.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-jurgh-red/20 blur-3xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Lopende projecten" value={active.length} accent />
        <StatCard label="Afgeronde behandelingen" value={done.length} />
        <StatCard label="JURGH punten" value={points.toLocaleString("nl-NL")} />
      </div>

      {/* Rewards / spaarsysteem */}
      <RewardsPanel points={points} />

      {/* Lopende projecten */}
      <section>
        <SectionTitle>Lopende projecten</SectionTitle>
        {active.length === 0 ? (
          <EmptyState
            title="Geen lopende projecten"
            description="Zodra JURGH met je auto aan de slag gaat, verschijnt het hier."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((p) => (
              <ProjectCard key={p.id} project={p} href={`/klant/dossier/${p.id}`} />
            ))}
          </div>
        )}
      </section>

      {/* Afgeronde projecten */}
      {done.length > 0 && (
        <section>
          <SectionTitle>Afgerond</SectionTitle>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {done.map((p) => (
              <ProjectCard key={p.id} project={p} href={`/klant/dossier/${p.id}`} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

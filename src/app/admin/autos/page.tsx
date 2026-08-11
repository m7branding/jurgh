import Link from "next/link";
import { listVehicles, vehicleTitle } from "@/lib/data";
import { StatCard, SectionTitle, EmptyState, CarThumb } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminAutosPage() {
  const vehicles = (await listVehicles()) as any[];

  const totalProjects = vehicles.reduce((s, v) => s + (v.projects?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-jurgh-text">Auto's</h1>
        <p className="text-jurgh-muted">Alle voertuigen in het portaal en hun behandelingen.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Auto's" value={vehicles.length} accent />
        <StatCard label="Projecten totaal" value={totalProjects} />
        <StatCard
          label="Afgerond"
          value={vehicles.reduce(
            (s, v) =>
              s +
              (v.projects?.filter((p: any) =>
                ["afgerond", "gefactureerd"].includes(p.status)
              ).length || 0),
            0
          )}
        />
      </div>

      <SectionTitle>Alle auto's</SectionTitle>
      {vehicles.length === 0 ? (
        <EmptyState title="Nog geen auto's" description="Auto's verschijnen zodra je een project aanmaakt." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => {
            const projectCount = v.projects?.length || 0;
            const doneCount =
              v.projects?.filter((p: any) => ["afgerond", "gefactureerd"].includes(p.status)).length || 0;
            return (
              <div key={v.id} className="card overflow-hidden">
                <div className="aspect-[16/10] overflow-hidden">
                  <CarThumb src={v.photo_url} alt={vehicleTitle(v)} />
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="font-semibold text-jurgh-text">{vehicleTitle(v)}</h3>
                  <p className="text-sm text-jurgh-muted">
                    <span className="font-mono uppercase">{v.license_plate}</span>
                    {v.customers ? ` · ${v.customers.name}` : ""}
                  </p>
                  <p className="text-xs text-jurgh-muted">
                    {projectCount} project{projectCount === 1 ? "" : "en"} · {doneCount} afgerond
                  </p>
                  <div className="flex gap-2 border-t border-jurgh-border pt-3">
                    <Link href={`/admin/autos/${v.id}`} className="btn-ghost px-3 py-1.5 text-xs">
                      Bekijk auto
                    </Link>
                    <Link href={`/passport/${v.id}`} target="_blank" className="btn-ghost px-3 py-1.5 text-xs">
                      🛡️ Passport
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

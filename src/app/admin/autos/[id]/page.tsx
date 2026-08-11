import Link from "next/link";
import { getVehicleWithProjects, vehicleTitle } from "@/lib/data";
import { CarThumb, BackLink, SectionTitle, EmptyState } from "@/components/ui";
import { ProjectCard } from "@/components/ProjectCard";
import { MileageForm } from "@/components/forms/StaffForms";

export const dynamic = "force-dynamic";

export default async function AdminVehicleDetailPage({ params }: { params: { id: string } }) {
  const result = await getVehicleWithProjects(params.id);

  if (!result) {
    return <EmptyState title="Auto niet gevonden" />;
  }

  const { vehicle, projects } = result;

  return (
    <div className="space-y-6">
      <BackLink href="/admin/autos">Terug naar auto's</BackLink>

      <div className="card overflow-hidden">
        <div className="grid md:grid-cols-[280px_1fr]">
          <div className="aspect-[4/3] md:aspect-auto md:h-full">
            <CarThumb src={vehicle.photo_url} alt={vehicleTitle(vehicle)} />
          </div>
          <div className="space-y-4 p-6">
            <div>
              <h1 className="text-2xl font-bold text-jurgh-text">{vehicleTitle(vehicle)}</h1>
              <p className="mt-1 text-jurgh-muted">
                <span className="font-mono uppercase tracking-wide text-jurgh-text">
                  {vehicle.license_plate}
                </span>
                {vehicle.customers ? ` · ${vehicle.customers.name}` : ""}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              {vehicle.year && <Field label="Bouwjaar" value={String(vehicle.year)} />}
              {vehicle.color && <Field label="Kleur" value={vehicle.color} />}
            </dl>

            <div className="max-w-xs">
              <MileageForm vehicleId={vehicle.id} mileage={vehicle.mileage} />
            </div>

            <Link href={`/passport/${vehicle.id}`} target="_blank" className="btn-ghost inline-flex">
              🛡️ Detailing Passport
            </Link>
          </div>
        </div>
      </div>

      <SectionTitle>Projecten ({projects.length})</SectionTitle>
      {projects.length === 0 ? (
        <EmptyState title="Nog geen projecten voor deze auto" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} href={`/admin/projecten/${p.id}`} mode="admin" />
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-jurgh-muted">{label}</dt>
      <dd className="font-medium text-jurgh-text">{value}</dd>
    </div>
  );
}

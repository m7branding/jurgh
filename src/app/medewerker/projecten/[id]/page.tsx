import { ProjectDetail } from "@/components/ProjectDetail";
import { BackLink } from "@/components/ui";
import { getProject, vehicleTitle } from "@/lib/data";
import { QuickLogFab } from "@/components/forms/QuickLogFab";

export const dynamic = "force-dynamic";

export default async function MedewerkerProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  const label = project
    ? `${vehicleTitle(project.vehicles)} — ${project.vehicles?.license_plate ?? ""}`
    : "Dit project";

  return (
    <div className="space-y-5">
      <BackLink href="/medewerker">Terug naar mijn projecten</BackLink>
      <ProjectDetail projectId={params.id} mode="medewerker" />
      <QuickLogFab projects={[{ id: params.id, label }]} defaultProjectId={params.id} />
    </div>
  );
}

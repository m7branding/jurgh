import { ProjectDetail } from "@/components/ProjectDetail";
import { BackLink } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function MedewerkerProjectPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-5">
      <BackLink href="/medewerker">Terug naar mijn projecten</BackLink>
      <ProjectDetail projectId={params.id} mode="medewerker" />
    </div>
  );
}

import { ProjectDetail } from "@/components/ProjectDetail";
import { BackLink } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function KlantDossierPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-5">
      <BackLink href="/klant">Terug naar dashboard</BackLink>
      <ProjectDetail projectId={params.id} mode="klant" />
    </div>
  );
}

import { ProjectDetail } from "@/components/ProjectDetail";
import { BackLink } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function AdminProjectPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-5">
      <BackLink href="/admin/projecten">Terug naar projecten</BackLink>
      <ProjectDetail projectId={params.id} mode="admin" />
    </div>
  );
}

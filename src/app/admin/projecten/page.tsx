import Link from "next/link";
import { listProjects } from "@/lib/data";
import { ProjectBrowser } from "@/components/ProjectBrowser";
import { SectionTitle, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminProjects() {
  const projects = await listProjects();
  return (
    <div className="space-y-6">
      <SectionTitle action={<Link href="/admin/projecten/nieuw" className="btn-primary">+ Nieuw project</Link>}>
        Alle projecten
      </SectionTitle>
      {projects.length === 0 ? (
        <EmptyState
          title="Nog geen projecten"
          action={<Link href="/admin/projecten/nieuw" className="btn-primary">+ Nieuw project</Link>}
        />
      ) : (
        <ProjectBrowser
          projects={projects}
          hrefBase="/admin/projecten"
          cta="Open project"
          mode="admin"
          defaultScope="alle"
        />
      )}
    </div>
  );
}

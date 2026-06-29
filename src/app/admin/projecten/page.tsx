import Link from "next/link";
import { listProjects } from "@/lib/data";
import { ProjectCard } from "@/components/ProjectCard";
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} href={`/admin/projecten/${p.id}`} cta="Open project" />
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { CarThumb, StatusBadge, Badge } from "@/components/ui";
import { vehicleTitle, type Project } from "@/lib/data";
import { PROJECT_TYPE_LABEL, formatDate, type ProjectType, type ProjectStatus } from "@/lib/constants";

export function ProjectCard({
  project,
  href,
  cta = "Bekijk dossier",
}: {
  project: Project;
  href: string;
  cta?: string;
}) {
  const v = project.vehicles;
  return (
    <Link
      href={href}
      className="card group overflow-hidden transition hover:border-jurgh-red/50 hover:shadow-glow"
    >
      <div className="aspect-[16/10] overflow-hidden">
        <CarThumb
          src={v?.photo_url}
          alt={vehicleTitle(v)}
          className="transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={project.status as ProjectStatus} />
          <Badge tone="neutral">{PROJECT_TYPE_LABEL[project.type as ProjectType]}</Badge>
        </div>
        <div>
          <h3 className="font-semibold text-jurgh-text">{vehicleTitle(v)}</h3>
          <p className="text-sm text-jurgh-muted">
            <span className="font-mono uppercase">{v?.license_plate}</span>
            {project.customers ? ` · ${project.customers.name}` : ""}
          </p>
        </div>
        <p className="line-clamp-1 text-sm text-jurgh-muted">{project.title}</p>
        <div className="flex items-center justify-between border-t border-jurgh-border pt-3 text-sm">
          <span className="text-jurgh-muted">
            Afspraak: {formatDate(project.appointment_date)}
          </span>
          <span className="font-semibold text-jurgh-red group-hover:underline">{cta} →</span>
        </div>
      </div>
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CarThumb, StatusBadge, Badge } from "@/components/ui";
import { vehicleTitle, type Project } from "@/lib/types";
import { PROJECT_TYPE_LABEL, formatDate, type ProjectType, type ProjectStatus } from "@/lib/constants";
import { WorkLogForm, ExtraWorkForm } from "@/components/forms/StaffForms";

type QuickAction = "log" | "meerwerk" | null;

export function ProjectCard({
  project,
  href,
  cta = "Bekijk dossier",
  mode = "klant",
}: {
  project: Project;
  href: string;
  cta?: string;
  mode?: "admin" | "medewerker" | "klant";
}) {
  const v = project.vehicles;
  const [sheet, setSheet] = useState<QuickAction>(null);
  const canLog = mode === "admin" || mode === "medewerker";
  const canManageExtraWork = mode === "admin";
  const actionCount = 1 + (canLog ? 1 : 0) + (canManageExtraWork ? 1 : 0);

  return (
    <div className="card group overflow-hidden transition hover:border-jurgh-red/50 hover:shadow-glow">
      <Link href={href} className="block">
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
          <div className="min-w-0">
            <h3 className="font-semibold text-jurgh-text">{vehicleTitle(v)}</h3>
            <p className="truncate text-sm text-jurgh-muted">
              <span className="font-mono uppercase">{v?.license_plate}</span>
              {project.customers ? ` · ${project.customers.name}` : ""}
            </p>
          </div>
          <p className="line-clamp-1 text-sm text-jurgh-muted">{project.title}</p>
          <p className="text-sm text-jurgh-muted">Afspraak: {formatDate(project.appointment_date)}</p>
        </div>
      </Link>

      {canLog || canManageExtraWork ? (
        <div
          className={`grid gap-px border-t border-jurgh-border bg-jurgh-border text-sm ${
            actionCount === 3 ? "grid-cols-3" : "grid-cols-2"
          }`}
        >
          {canLog && (
            <button
              type="button"
              onClick={() => setSheet("log")}
              className="bg-jurgh-card px-2 py-2.5 font-medium text-jurgh-muted transition hover:text-jurgh-text"
            >
              Werk loggen
            </button>
          )}
          {canManageExtraWork && (
            <button
              type="button"
              onClick={() => setSheet("meerwerk")}
              className="bg-jurgh-card px-2 py-2.5 font-medium text-jurgh-muted transition hover:text-jurgh-text"
            >
              Meerwerk
            </button>
          )}
          <Link
            href={href}
            className="bg-jurgh-card px-2 py-2.5 text-center font-semibold text-jurgh-red hover:underline"
          >
            {cta}
          </Link>
        </div>
      ) : (
        <Link
          href={href}
          className="block border-t border-jurgh-border px-4 py-2.5 text-center text-sm font-semibold text-jurgh-red hover:underline"
        >
          {cta} →
        </Link>
      )}

      {sheet && (
        <QuickActionSheet
          title={sheet === "log" ? "Uren loggen" : "Meerwerk voorstellen"}
          onClose={() => setSheet(null)}
        >
          {sheet === "log" && <WorkLogForm projectId={project.id} />}
          {sheet === "meerwerk" && <ExtraWorkForm projectId={project.id} />}
        </QuickActionSheet>
      )}
    </div>
  );
}

function QuickActionSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[70vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-jurgh-border bg-jurgh-card p-6 shadow-2xl sm:rounded-2xl sm:border">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-jurgh-text">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-jurgh-muted hover:bg-white/5 hover:text-jurgh-text"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "@/components/ProjectCard";
import { PROJECT_TYPES, projectTypeLabel } from "@/lib/constants";
import { vehicleTitle, type Project } from "@/lib/types";

type Scope = "lopend" | "afgerond" | "alle";

const AFGEROND = ["afgerond", "gefactureerd", "gearchiveerd"];

const SCOPES: { value: Scope; label: string }[] = [
  { value: "lopend", label: "Lopende projecten" },
  { value: "afgerond", label: "Afgerond & gearchiveerd" },
  { value: "alle", label: "Alle projecten" },
];

/** Alles waarop gezocht kan worden: auto, kenteken, klant en project. */
function haystack(p: Project): string {
  return [
    p.title,
    projectTypeLabel(p.type),
    vehicleTitle(p.vehicles),
    p.vehicles?.license_plate,
    p.vehicles?.make,
    p.vehicles?.model,
    p.vehicles?.color,
    p.customers?.name,
    p.customers?.company_name,
    p.customers?.email,
    p.customers?.phone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Zoekterm mag met of zonder streepjes: "xx001x" vindt ook "XX-001-X". */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function inScope(p: Project, scope: Scope): boolean {
  if (scope === "alle") return true;
  const done = AFGEROND.includes(p.status);
  return scope === "afgerond" ? done : !done;
}

export function ProjectBrowser({
  projects,
  hrefBase,
  cta = "Open project",
  mode = "admin",
  defaultScope = "alle",
}: {
  projects: Project[];
  hrefBase: string;
  cta?: string;
  mode?: "admin" | "medewerker" | "klant";
  defaultScope?: Scope;
}) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>(defaultScope);
  const [type, setType] = useState("");

  const index = useMemo(
    () => projects.map((p) => ({ project: p, text: haystack(p), plain: normalize(haystack(p)) })),
    [projects]
  );

  const { visible, outsideScope } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qPlain = normalize(query);

    const hits = index.filter(({ text, plain }) => {
      if (!q) return true;
      return text.includes(q) || (qPlain.length >= 2 && plain.includes(qPlain));
    });

    const byType = hits.filter(({ project }) => !type || project.type === type);

    return {
      visible: byType.filter(({ project }) => inScope(project, scope)).map((h) => h.project),
      // aantal treffers dat buiten het huidige statusfilter valt
      outsideScope: byType.filter(({ project }) => !inScope(project, scope)).length,
    };
  }, [index, query, scope, type]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          className="input sm:max-w-sm"
          placeholder="Zoek op auto, kenteken, klant of project…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Zoeken in projecten"
        />
        <select
          className="input sm:max-w-[220px]"
          value={scope}
          onChange={(e) => setScope(e.target.value as Scope)}
          aria-label="Statusfilter"
        >
          {SCOPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          className="input sm:max-w-[220px]"
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Projecttype"
        >
          <option value="">Alle projecttypes</option>
          {PROJECT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-jurgh-muted">
        <span>
          {visible.length} van {projects.length} projecten
        </span>
        {(query || type || scope !== defaultScope) && (
          <button
            type="button"
            className="text-jurgh-red hover:underline"
            onClick={() => {
              setQuery("");
              setType("");
              setScope(defaultScope);
            }}
          >
            Filters wissen
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="font-medium text-jurgh-text">Geen projecten gevonden</p>
          <p className="mt-1 text-sm text-jurgh-muted">
            {outsideScope > 0
              ? `Wel ${outsideScope} ${outsideScope === 1 ? "project" : "projecten"} buiten het huidige statusfilter.`
              : "Pas de zoekterm of de filters aan."}
          </p>
          {outsideScope > 0 && (
            <button type="button" className="btn-ghost mt-4" onClick={() => setScope("alle")}>
              Zoek in alle projecten
            </button>
          )}
        </div>
      ) : (
        <>
          {outsideScope > 0 && query && (
            <p className="text-sm text-jurgh-muted">
              Nog {outsideScope} {outsideScope === 1 ? "treffer" : "treffers"} buiten dit statusfilter.{" "}
              <button
                type="button"
                className="text-jurgh-red hover:underline"
                onClick={() => setScope("alle")}
              >
                Toon alles
              </button>
            </p>
          )}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                href={`${hrefBase}/${p.id}`}
                cta={cta}
                mode={mode}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

import {
  getProject,
  getStatusHistory,
  getRemarks,
  getWorkLogs,
  getPhotos,
  getDocuments,
  vehicleTitle,
} from "@/lib/data";
import {
  PROJECT_TYPE_LABEL,
  STATUS_LABEL,
  PHOTO_LABEL,
  WORK_TYPE_LABEL,
  DOCUMENT_TYPE_LABEL,
  formatPrice,
  formatDate,
  formatDateTime,
  type ProjectType,
  type ProjectStatus,
  type PhotoLabel,
  type WorkType,
  type DocumentType,
} from "@/lib/constants";
import {
  StatusBadge,
  StatusProgress,
  CarThumb,
  Badge,
  Check,
  SectionTitle,
  EmptyState,
} from "@/components/ui";
import {
  StatusForm,
  CompleteButton,
  RemarkForm,
  WorkLogForm,
  PhotoUploadForm,
  DocumentUploadForm,
  PhotoVisibilityToggle,
} from "@/components/forms/StaffForms";

type Mode = "admin" | "medewerker" | "klant";

// Statussen die een medewerker zelf mag zetten (sectie 2)
const MEDEWERKER_STATUSES: ProjectStatus[] = [
  "auto_ontvangen",
  "in_behandeling",
  "wacht_op_klant",
  "kwaliteitscontrole",
  "klaar_voor_oplevering",
];

export async function ProjectDetail({
  projectId,
  mode,
}: {
  projectId: string;
  mode: Mode;
}) {
  const project = await getProject(projectId);
  if (!project) {
    return <EmptyState title="Project niet gevonden" />;
  }

  const isStaff = mode !== "klant";
  const isAdmin = mode === "admin";

  const [history, remarks, photos, documents, workLogs] = await Promise.all([
    getStatusHistory(projectId),
    getRemarks(projectId),
    getPhotos(projectId),
    getDocuments(projectId),
    isStaff ? getWorkLogs(projectId) : Promise.resolve([] as any[]),
  ]);

  const v = project.vehicles;
  const c = project.customers;
  const totalHours = workLogs.reduce((s: number, w: any) => s + Number(w.hours || 0), 0);

  return (
    <div className="space-y-6">
      {/* ---------- Header ---------- */}
      <div className="card overflow-hidden">
        <div className="grid md:grid-cols-[280px_1fr]">
          <div className="aspect-[4/3] md:aspect-auto md:h-full">
            <CarThumb src={v?.photo_url} alt={vehicleTitle(v)} />
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={project.status as ProjectStatus} />
              <Badge tone="neutral">{PROJECT_TYPE_LABEL[project.type as ProjectType]}</Badge>
              {project.completed_at && (
                <Badge tone="green">
                  <Check className="h-3 w-3" /> Compleet
                </Badge>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold text-jurgh-text">{project.title}</h1>
            <p className="mt-1 text-jurgh-muted">
              {vehicleTitle(v)} ·{" "}
              <span className="font-mono uppercase tracking-wide text-jurgh-text">
                {v?.license_plate}
              </span>
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Field label="Klant" value={c?.name} />
              {v?.year && <Field label="Bouwjaar" value={String(v.year)} />}
              {v?.color && <Field label="Kleur" value={v.color} />}
              {v?.mileage != null && <Field label="Km-stand" value={v.mileage.toLocaleString("nl-NL")} />}
              <Field label="Afspraak" value={formatDate(project.appointment_date)} />
              <Field label="Verwachte oplevering" value={formatDate(project.expected_delivery_date)} />
              {isAdmin && <Field label="Prijs" value={formatPrice(project.price)} />}
            </dl>

            <div className="mt-6">
              <StatusProgress status={project.status as ProjectStatus} />
            </div>
          </div>
        </div>
      </div>

      {project.customer_notes && (
        <div className="panel p-4 text-sm text-jurgh-muted">
          <span className="font-semibold text-jurgh-text">Bericht voor de klant: </span>
          {project.customer_notes}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ---------- Linkerkolom: tijdlijn & historie ---------- */}
        <div className="space-y-6">
          <section className="card p-6">
            <SectionTitle>Tijdlijn</SectionTitle>
            <Timeline history={history} remarks={remarks} showHidden={isStaff} />
          </section>

          {/* Bijzonderheden */}
          <section className="card p-6">
            <SectionTitle>Bijzonderheden & opmerkingen</SectionTitle>
            {remarks.length === 0 ? (
              <p className="text-sm text-jurgh-muted">Nog geen bijzonderheden vastgelegd.</p>
            ) : (
              <ul className="space-y-3">
                {remarks
                  .filter((r: any) => isStaff || r.visible_to_customer)
                  .map((r: any) => (
                    <li key={r.id} className="rounded-xl border border-jurgh-border bg-jurgh-black/40 p-3">
                      <div className="flex items-center justify-between text-xs text-jurgh-muted">
                        <span>{formatDateTime(r.created_at)}</span>
                        {isStaff && !r.visible_to_customer && (
                          <Badge tone="neutral">Intern</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-jurgh-text">{r.body}</p>
                    </li>
                  ))}
              </ul>
            )}
            {isStaff && (
              <div className="mt-4 border-t border-jurgh-border pt-4">
                <RemarkForm projectId={projectId} />
              </div>
            )}
          </section>

          {/* Urenregistratie (alleen staff) */}
          {isStaff && (
            <section className="card p-6">
              <SectionTitle
                action={
                  <span className="text-sm text-jurgh-muted">
                    Totaal: <span className="font-semibold text-jurgh-text">{totalHours.toFixed(2)} u</span>
                  </span>
                }
              >
                Urenregistratie
              </SectionTitle>
              {workLogs.length > 0 && (
                <div className="mb-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-jurgh-muted">
                        <th className="py-2 pr-3">Datum</th>
                        <th className="py-2 pr-3">Type</th>
                        <th className="py-2 pr-3">Uren</th>
                        <th className="py-2 pr-3">Medewerker</th>
                        <th className="py-2">Omschrijving</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workLogs.map((w: any) => (
                        <tr key={w.id} className="border-t border-jurgh-border">
                          <td className="py-2 pr-3 text-jurgh-muted">{formatDate(w.log_date)}</td>
                          <td className="py-2 pr-3">{WORK_TYPE_LABEL[w.work_type as WorkType]}</td>
                          <td className="py-2 pr-3 font-semibold text-jurgh-text">{Number(w.hours).toFixed(2)}</td>
                          <td className="py-2 pr-3 text-jurgh-muted">{w.profiles?.full_name ?? "—"}</td>
                          <td className="py-2 text-jurgh-muted">{w.description ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="border-t border-jurgh-border pt-4">
                <WorkLogForm projectId={projectId} />
              </div>
            </section>
          )}

          {/* Interne notities (alleen admin) */}
          {isAdmin && project.internal_notes && (
            <section className="card p-6">
              <SectionTitle>Interne notities</SectionTitle>
              <p className="whitespace-pre-line text-sm text-jurgh-muted">{project.internal_notes}</p>
            </section>
          )}
        </div>

        {/* ---------- Rechterkolom: acties, foto's, documenten ---------- */}
        <div className="space-y-6">
          {/* Status bijwerken */}
          {isStaff && (
            <section className="card p-6">
              <SectionTitle>Status bijwerken</SectionTitle>
              <StatusForm
                projectId={projectId}
                current={project.status as ProjectStatus}
                allowed={isAdmin ? undefined : MEDEWERKER_STATUSES}
              />
              {isAdmin && project.status !== "afgerond" && (
                <div className="mt-4 border-t border-jurgh-border pt-4">
                  <CompleteButton projectId={projectId} />
                </div>
              )}
            </section>
          )}

          {/* Foto's */}
          <section className="card p-6">
            <SectionTitle>Foto's</SectionTitle>
            {photos.length === 0 ? (
              <p className="text-sm text-jurgh-muted">Nog geen foto's beschikbaar.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {photos.map((p) => (
                  <figure key={p.id} className="overflow-hidden rounded-xl border border-jurgh-border bg-jurgh-black/40">
                    {p.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.url} alt={p.caption ?? p.label} className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="aspect-square w-full" />
                    )}
                    <figcaption className="space-y-1 p-2">
                      <Badge tone="neutral">{PHOTO_LABEL[p.label as PhotoLabel]}</Badge>
                      {p.caption && <p className="text-xs text-jurgh-muted">{p.caption}</p>}
                      {isStaff && (
                        <PhotoVisibilityToggle
                          photoId={p.id}
                          projectId={projectId}
                          visible={p.visible_to_customer}
                        />
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
            {isStaff && (
              <div className="mt-4 border-t border-jurgh-border pt-4">
                <PhotoUploadForm projectId={projectId} />
              </div>
            )}
          </section>

          {/* Documenten */}
          <section className="card p-6">
            <SectionTitle>Documenten</SectionTitle>
            {documents.length === 0 ? (
              <p className="text-sm text-jurgh-muted">Nog geen documenten beschikbaar.</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-jurgh-border bg-jurgh-black/40 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-jurgh-text">{d.name}</p>
                      <span className="text-xs text-jurgh-muted">
                        {DOCUMENT_TYPE_LABEL[d.type as DocumentType]} · {formatDate(d.created_at)}
                      </span>
                    </div>
                    {d.url && (
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3 py-1.5">
                        Download
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {isStaff && (
              <div className="mt-4 border-t border-jurgh-border pt-4">
                <DocumentUploadForm projectId={projectId} />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-jurgh-muted">{label}</dt>
      <dd className="font-medium text-jurgh-text">{value || "—"}</dd>
    </div>
  );
}

function Timeline({
  history,
  remarks,
  showHidden,
}: {
  history: any[];
  remarks: any[];
  showHidden: boolean;
}) {
  type Item = { id: string; at: string; kind: "status" | "remark"; text: string };
  const items: Item[] = [
    ...history.map((h: any) => ({
      id: "s" + h.id,
      at: h.created_at,
      kind: "status" as const,
      text: STATUS_LABEL[h.status as ProjectStatus] + (h.note ? ` — ${h.note}` : ""),
    })),
    ...remarks
      .filter((r: any) => showHidden || r.visible_to_customer)
      .map((r: any) => ({
        id: "r" + r.id,
        at: r.created_at,
        kind: "remark" as const,
        text: r.body,
      })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  if (items.length === 0) {
    return <p className="text-sm text-jurgh-muted">Nog geen gebeurtenissen.</p>;
  }

  return (
    <ol className="relative space-y-4 border-l border-jurgh-border pl-5">
      {items.map((it) => (
        <li key={it.id} className="relative">
          <span
            className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-jurgh-card ${
              it.kind === "status" ? "bg-jurgh-red" : "bg-jurgh-gold"
            }`}
          />
          <p className="text-xs text-jurgh-muted">{formatDateTime(it.at)}</p>
          <p className="text-sm text-jurgh-text">{it.text}</p>
        </li>
      ))}
    </ol>
  );
}

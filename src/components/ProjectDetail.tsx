import Link from "next/link";
import {
  getProject,
  getStatusHistory,
  getRemarks,
  getWorkLogs,
  getExtraWork,
  getExtraWorkCatalog,
  getPhotos,
  getDocuments,
  vehicleTitle,
} from "@/lib/data";
import { getSessionProfile } from "@/lib/auth";
import {
  projectTypeLabel,
  STATUS_LABEL,
  PHOTO_LABEL,
  DOCUMENT_TYPE_LABEL,
  EXTRA_WORK_STATUS_LABEL,
  PRICING_MODE_LABEL,
  extraWorkTone,
  formatPrice,
  priceInclBtw,
  formatDate,
  formatDateTime,
  type ProjectStatus,
  type PhotoLabel,
  type DocumentType,
  type ExtraWorkStatus,
  type PricingMode,
} from "@/lib/constants";
import {
  StatusBadge,
  StatusProgress,
  CarThumb,
  Badge,
  Check,
  SectionTitle,
  EmptyState,
  Collapsible,
  Plate,
} from "@/components/ui";
import {
  StatusForm,
  CompleteButton,
  RemarkForm,
  WorkLogForm,
  ExtraWorkForm,
  ExtraWorkSendButton,
  ExtraWorkRespond,
  ExtraWorkStatusControl,
  PhotoUploadForm,
  DocumentUploadForm,
  VehiclePhotoForm,
  PhotoVisibilityToggle,
  ProjectExtrasForm,
  WorkLogRow,
} from "@/components/forms/StaffForms";

type Mode = "admin" | "medewerker" | "klant";

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

  const isMedewerker = mode === "medewerker";

  const [history, remarks, photos, documents, workLogs, extraWork, extraWorkCatalog, sessionProfile] =
    await Promise.all([
      getStatusHistory(projectId),
      getRemarks(projectId),
      getPhotos(projectId),
      isMedewerker ? Promise.resolve([] as any[]) : getDocuments(projectId),
      isStaff ? getWorkLogs(projectId) : Promise.resolve([] as any[]),
      getExtraWork(projectId),
      isAdmin ? getExtraWorkCatalog() : Promise.resolve([] as any[]),
      isStaff ? getSessionProfile() : Promise.resolve(null),
    ]);

  const v = project.vehicles;
  const c = project.customers;
  const totalHours = workLogs.reduce((s: number, w: any) => s + Number(w.hours || 0), 0);

  // Prijzen worden excl. btw ingevoerd; particuliere klant (niet-zakelijk) ziet incl. btw.
  const showInclBtw = mode === "klant" && !c?.is_business;
  const displayPrice = (value: number | null | undefined) =>
    formatPrice(showInclBtw ? priceInclBtw(value) : value);

  // Urenregistratie-kaart: voor medewerkers bovenaan en uitgelicht, met het
  // logformulier direct bovenaan voor snel loggen.
  const workLogSection = isStaff ? (
    <section className={`card p-6 ${isMedewerker ? "ring-2 ring-jurgh-red/30" : ""}`}>
      <SectionTitle
        action={
          <span className="text-sm text-jurgh-muted">
            Totaal: <span className="font-semibold text-jurgh-text">{totalHours.toFixed(2)} u</span>
          </span>
        }
      >
        {isMedewerker ? "⏱ Snel uren loggen" : "Urenregistratie"}
      </SectionTitle>
      <WorkLogForm projectId={projectId} />
      {workLogs.length > 0 && (
        <div className="mt-4 overflow-x-auto border-t border-jurgh-border pt-4">
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
                <WorkLogRow
                  key={w.id}
                  log={{
                    id: w.id,
                    project_id: projectId,
                    log_date: w.log_date,
                    work_type: w.work_type,
                    hours: w.hours,
                    description: w.description,
                    employeeName: w.profiles?.full_name ?? "—",
                  }}
                  canEdit={isAdmin || w.employee_id === sessionProfile?.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  ) : null;

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
              <Badge tone="neutral">{projectTypeLabel(project.type)}</Badge>
              {project.completed_at && (
                <Badge tone="green">
                  <Check className="h-3 w-3" /> Compleet
                </Badge>
              )}
              {project.loaner_car && (
                <Badge tone="neutral">
                  🚗 Leenauto{project.loaner_car_plate ? ` · ${project.loaner_car_plate}` : ""}
                </Badge>
              )}
              {project.transport && <Badge tone="neutral">🚛 Transport</Badge>}
            </div>
            <h1 className="mt-3 text-2xl font-bold text-jurgh-text">{project.title}</h1>
            <p className="mt-1 text-jurgh-muted">
              {vehicleTitle(v)} · <Plate value={v?.license_plate} className="text-jurgh-text" />
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Field label="Klant" value={c?.company_name ? `${c.name} (${c.company_name})` : c?.name} />
              {isStaff && c?.phone && <Field label="Telefoon klant" value={c.phone} />}
              {isStaff && c?.email && <Field label="E-mail klant" value={c.email} />}
              {v?.year && <Field label="Bouwjaar" value={String(v.year)} />}
              {v?.color && <Field label="Kleur" value={v.color} />}
              {v?.mileage != null && <Field label="Km-stand" value={v.mileage.toLocaleString("nl-NL")} />}
              <Field label="Afspraak" value={formatDate(project.appointment_date)} />
              <Field label="Verwachte oplevering" value={formatDate(project.expected_delivery_date)} />
              {isAdmin && <Field label="Prijs (excl. btw)" value={formatPrice(project.price)} />}
              {mode === "klant" && project.price != null && (
                <Field
                  label={showInclBtw ? "Prijs (incl. btw)" : "Prijs (excl. btw)"}
                  value={displayPrice(project.price)}
                />
              )}
            </dl>

            <div className="mt-6">
              <StatusProgress status={project.status as ProjectStatus} />
            </div>

            <div className="mt-5">
              <Link
                href={`/passport/${project.vehicle_id}`}
                target="_blank"
                className="btn-ghost"
              >
                🛡️ Detailing Passport exporteren
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isStaff && (
        <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
          <span className="text-sm font-medium text-jurgh-text">
            Auto-foto {v?.photo_url ? "" : "(nog geen foto)"}
          </span>
          <VehiclePhotoForm
            vehicleId={project.vehicle_id}
            projectId={projectId}
            hasPhoto={!!v?.photo_url}
          />
        </div>
      )}

      {project.customer_notes && (
        <div className="panel p-4 text-sm text-jurgh-muted">
          <span className="font-semibold text-jurgh-text">Bericht voor de klant: </span>
          {project.customer_notes}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ---------- Linkerkolom: tijdlijn & historie ---------- */}
        <div className="space-y-6">
          {/* Medewerker: loggen bovenaan en uitgelicht */}
          {isMedewerker && workLogSection}

          <Collapsible title="Tijdlijn">
            <Timeline history={history} remarks={remarks} showHidden={isStaff} />
          </Collapsible>

          {/* Bijzonderheden */}
          <Collapsible title="Bijzonderheden & opmerkingen">
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
          </Collapsible>

          {/* Meerwerk / minderwerk */}
          <Collapsible title="Meerwerk & extra werk">
            {extraWork.length === 0 ? (
              <p className="text-sm text-jurgh-muted">
                {isStaff
                  ? "Nog geen meerwerk vastgelegd."
                  : "Er is op dit moment geen meerwerk voorgesteld."}
              </p>
            ) : (
              <ul className="space-y-3">
                {extraWork.map((e: any) => (
                  <li key={e.id} className="rounded-xl border border-jurgh-border bg-jurgh-black/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-jurgh-text">{e.title}</p>
                        {e.description && (
                          <p className="mt-0.5 text-sm text-jurgh-muted">{e.description}</p>
                        )}
                        <p className="mt-1 text-xs text-jurgh-muted">
                          {displayPrice(Number(e.price))}
                          {showInclBtw ? " incl. btw" : ""}
                          {" "}({PRICING_MODE_LABEL[(e.pricing_mode as PricingMode) || "totaal"]})
                          {Number(e.estimated_hours) > 0 ? ` · ${Number(e.estimated_hours)} u extra` : ""}
                        </p>
                      </div>
                      <Badge tone={extraWorkTone(e.status as ExtraWorkStatus)}>
                        {EXTRA_WORK_STATUS_LABEL[e.status as ExtraWorkStatus]}
                      </Badge>
                    </div>

                    {/* Klant: accepteren/afwijzen wanneer voorgesteld */}
                    {mode === "klant" && e.status === "voorgesteld" && (
                      <div className="mt-3 border-t border-jurgh-border pt-3">
                        <ExtraWorkRespond id={e.id} projectId={projectId} />
                      </div>
                    )}
                    {/* Admin: concept versturen naar klant */}
                    {isAdmin && e.status === "concept" && (
                      <div className="mt-3 border-t border-jurgh-border pt-3">
                        <ExtraWorkSendButton id={e.id} projectId={projectId} />
                      </div>
                    )}
                    {/* Admin: status beheren */}
                    {isAdmin && (
                      <div className="mt-3 border-t border-jurgh-border pt-3">
                        <ExtraWorkStatusControl id={e.id} projectId={projectId} current={e.status} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {isAdmin && (
              <div className="mt-4 border-t border-jurgh-border pt-4">
                <ExtraWorkForm projectId={projectId} catalog={extraWorkCatalog} />
              </div>
            )}
          </Collapsible>

          {/* Admin: urenregistratie in normale positie */}
          {isAdmin && workLogSection}

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
          {/* Status bijwerken (alleen admin) */}
          {isAdmin && (
            <Collapsible title="Status bijwerken">
              <StatusForm projectId={projectId} current={project.status as ProjectStatus} />
              {project.status !== "afgerond" && (
                <div className="mt-4 border-t border-jurgh-border pt-4">
                  <CompleteButton projectId={projectId} />
                </div>
              )}
            </Collapsible>
          )}

          {/* Leenauto / transport (admin) */}
          {isAdmin && (
            <section className="card p-6">
              <SectionTitle>Leenauto &amp; transport</SectionTitle>
              <ProjectExtrasForm
                projectId={projectId}
                loanerCar={project.loaner_car}
                loanerCarPlate={project.loaner_car_plate}
                transport={project.transport}
              />
            </section>
          )}

          {/* Foto's */}
          <Collapsible title="Foto's">
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
          </Collapsible>

          {/* Documenten (niet zichtbaar voor medewerker) */}
          {!isMedewerker && (
          <Collapsible title="Documenten">
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
            {isAdmin && (
              <div className="mt-4 border-t border-jurgh-border pt-4">
                <DocumentUploadForm projectId={projectId} />
              </div>
            )}
          </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-jurgh-muted">{label}</dt>
      <dd className="break-words font-medium text-jurgh-text">{value || "—"}</dd>
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
  type Item = { id: string; at: string; kind: "status" | "remark"; text: string; by?: string };
  const items: Item[] = [
    ...history.map((h: any) => ({
      id: "s" + h.id,
      at: h.created_at,
      kind: "status" as const,
      text: STATUS_LABEL[h.status as ProjectStatus] + (h.note ? ` — ${h.note}` : ""),
      by: h.profiles?.full_name || undefined,
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
          <p className="text-xs text-jurgh-muted">
            {formatDateTime(it.at)}
            {it.by ? ` · door ${it.by}` : ""}
          </p>
          <p className="text-sm text-jurgh-text">{it.text}</p>
        </li>
      ))}
    </ol>
  );
}

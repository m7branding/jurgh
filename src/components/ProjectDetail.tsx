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
  getServiceLink,
} from "@/lib/data";
import { planTekst } from "@/lib/plan";
import { PlanVanAanpak } from "@/components/PlanVanAanpak";
import { updateProjectPlan } from "@/app/actions/projects";
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
  CarThumb,
  Badge,
  Check,
  SectionTitle,
  EmptyState,
  VehicleLine,
  TabSplit,
  StatusProgress,
} from "@/components/ui";
import { Tabs, type TabItem } from "@/components/Tabs";
import { PublishPanel, PublishLinks } from "@/components/forms/PublishForm";
import {
  StatusDropdown,
  ProjectDateField,
  RemarkForm,
  WorkLogForm,
  ExtraWorkForm,
  ExtraWorkSendButton,
  ExtraWorkStatusControl,
  PhotoUploadForm,
  DocumentUploadForm,
  VehiclePhotoButtons,
  PhotoVisibilityToggle,
  ProjectExtrasForm,
  WorkLogRow,
} from "@/components/forms/StaffForms";

// ============================================================
// Projectpagina voor admin en medewerker. De klant heeft een eigen
// opzet (KlantDossier) — die is niet te bedienen, deze wel.
// ============================================================

type Mode = "admin" | "medewerker";

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

  const isAdmin = mode === "admin";
  const isMedewerker = mode === "medewerker";

  const [
    history,
    remarks,
    photos,
    documents,
    workLogs,
    extraWork,
    extraWorkCatalog,
    sessionProfile,
    serviceLink,
  ] = await Promise.all([
      getStatusHistory(projectId),
      getRemarks(projectId),
      getPhotos(projectId),
      isMedewerker ? Promise.resolve([] as any[]) : getDocuments(projectId),
      getWorkLogs(projectId),
      getExtraWork(projectId),
      isAdmin ? getExtraWorkCatalog() : Promise.resolve([] as any[]),
      getSessionProfile(),
      isAdmin ? getServiceLink(project.type) : Promise.resolve(null),
    ]);

  const v = project.vehicles;
  const c = project.customers;
  const status = project.status as ProjectStatus;
  const totalHours = workLogs.reduce((s: number, w: any) => s + Number(w.hours || 0), 0);
  const aangevraagd = (extraWork as any[]).filter((e) => e.status === "aangevraagd").length;

  // ---------------- tabbladen: lijst links, aanmaken rechts ----------------
  const tabs: TabItem[] = [
    {
      id: "proces",
      label: "Proces",
      content: (
        <TabSplit
          list={
            <section className="card p-6">
              <SectionTitle>Tijdlijn</SectionTitle>
              <Timeline history={history} remarks={remarks} />
            </section>
          }
          form={
            <>
              <section className="card p-6">
                <SectionTitle>Notitie toevoegen</SectionTitle>
                <RemarkForm projectId={projectId} />
              </section>

              {isAdmin && project.internal_notes && (
                <section className="card p-6">
                  <SectionTitle>Interne notitie</SectionTitle>
                  <p className="whitespace-pre-line text-sm text-jurgh-muted">
                    {project.internal_notes}
                  </p>
                </section>
              )}
            </>
          }
        />
      ),
    },
    {
      id: "fotos",
      label: "Foto's",
      content: (
        <TabSplit
          list={
            photos.length === 0 ? (
              <p className="text-sm text-jurgh-muted">Nog geen foto's bij dit project.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((p) => (
                  <figure
                    key={p.id}
                    className="overflow-hidden rounded-xl border border-jurgh-border bg-jurgh-black/40"
                  >
                    {p.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.url}
                        alt={p.caption ?? p.label}
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-square w-full" />
                    )}
                    <figcaption className="space-y-1 p-2">
                      <Badge tone="neutral">{PHOTO_LABEL[p.label as PhotoLabel]}</Badge>
                      {p.extra_work_id && <Badge tone="amber">Extra werk</Badge>}
                      {p.caption && <p className="text-xs text-jurgh-muted">{p.caption}</p>}
                      <PhotoVisibilityToggle
                        photoId={p.id}
                        projectId={projectId}
                        visible={p.visible_to_customer}
                      />
                    </figcaption>
                  </figure>
                ))}
              </div>
            )
          }
          form={
            <section className="card p-6">
              <SectionTitle>Foto toevoegen</SectionTitle>
              <PhotoUploadForm
                projectId={projectId}
                extraWorkOptions={(extraWork as any[]).map((e) => ({ id: e.id, title: e.title }))}
              />
            </section>
          }
        />
      ),
    },
    {
      id: "uren",
      label: "Urenregistratie",
      content: (
        <TabSplit
          list={
            workLogs.length === 0 ? (
              <p className="text-sm text-jurgh-muted">Nog geen uren gelogd op dit project.</p>
            ) : (
              <section className="card p-6">
                <div className="overflow-x-auto">
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
              </section>
            )
          }
          form={
            <section className="card p-6">
              <SectionTitle
                action={
                  <span className="text-sm text-jurgh-muted">
                    Totaal:{" "}
                    <span className="font-semibold text-jurgh-text">{totalHours.toFixed(2)} u</span>
                  </span>
                }
              >
                Uren loggen
              </SectionTitle>
              <WorkLogForm projectId={projectId} />
            </section>
          }
        />
      ),
    },
    {
      id: "meerwerk",
      label: "Meerwerk & extra's",
      dot: aangevraagd > 0,
      content: (
        <TabSplit
          list={
            extraWork.length === 0 ? (
              <p className="text-sm text-jurgh-muted">Er is nog geen meerwerk vastgelegd.</p>
            ) : (
              <ul className="space-y-3">
                {extraWork.map((e: any) => (
                  <li key={e.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-jurgh-text">{e.title}</p>
                        {e.description && (
                          <p className="mt-0.5 text-sm text-jurgh-muted">{e.description}</p>
                        )}
                        <p className="mt-1 text-xs text-jurgh-muted">
                          {formatPrice(Number(e.price))} (
                          {PRICING_MODE_LABEL[(e.pricing_mode as PricingMode) || "totaal"]})
                          {Number(e.estimated_hours) > 0
                            ? ` · ${Number(e.estimated_hours)} u extra`
                            : ""}
                        </p>
                        <p className="mt-1 text-xs text-jurgh-muted">
                          {e.status === "aangevraagd" ? "Aangevraagd door klant" : "Toegevoegd"} ·{" "}
                          {formatDateTime(e.created_at)}
                        </p>
                      </div>
                      <Badge tone={extraWorkTone(e.status as ExtraWorkStatus)}>
                        {EXTRA_WORK_STATUS_LABEL[e.status as ExtraWorkStatus] ?? e.status}
                      </Badge>
                    </div>

                    {isAdmin && e.status === "concept" && (
                      <div className="mt-3 border-t border-jurgh-border pt-3">
                        <ExtraWorkSendButton id={e.id} projectId={projectId} />
                      </div>
                    )}
                    {isAdmin && (
                      <div className="mt-3 border-t border-jurgh-border pt-3">
                        <ExtraWorkStatusControl id={e.id} projectId={projectId} current={e.status} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )
          }
          form={
            isAdmin ? (
              <>
                <section className="card p-6">
                  <SectionTitle>Meerwerk toevoegen</SectionTitle>
                  <ExtraWorkForm projectId={projectId} catalog={extraWorkCatalog} />
                </section>
                <section className="card p-6">
                  <SectionTitle>Leenauto &amp; transport</SectionTitle>
                  <ProjectExtrasForm
                    projectId={projectId}
                    loanerCar={project.loaner_car}
                    loanerCarPlate={project.loaner_car_plate}
                    transport={project.transport}
                  />
                  {(project.loaner_car_requested_at || project.transport_requested_at) && (
                    <div className="mt-3 space-y-1 border-t border-jurgh-border pt-3 text-xs text-jurgh-muted">
                      {project.loaner_car_requested_at && (
                        <p>
                          Leenauto aangevraagd door klant ·{" "}
                          {formatDateTime(project.loaner_car_requested_at)}
                        </p>
                      )}
                      {project.transport_requested_at && (
                        <p>
                          Transport aangevraagd door klant ·{" "}
                          {formatDateTime(project.transport_requested_at)}
                        </p>
                      )}
                    </div>
                  )}
                </section>
              </>
            ) : null
          }
        />
      ),
    },
  ];

  // Plan van aanpak: informatie voor de klant, alleen de admin past het aan.
  if (isAdmin) {
    const dienstTekst = serviceLink?.plan_text ?? "";
    const eigenTekst = project.plan_text?.trim() ? project.plan_text : null;
    tabs.push({
      id: "plan",
      label: "Plan van aanpak",
      content: (
        <TabSplit
          list={
            <section className="card p-6">
              <SectionTitle
                action={
                  <Badge tone={eigenTekst ? "amber" : "neutral"}>
                    {eigenTekst ? "Aangepast voor dit project" : "Standaard van de dienst"}
                  </Badge>
                }
              >
                Zo ziet de klant het
              </SectionTitle>
              <PlanVanAanpak text={planTekst(eigenTekst, dienstTekst)} />
            </section>
          }
          form={
            <section className="card p-6">
              <SectionTitle>Aanpassen voor dit project</SectionTitle>
              {/* key: na opslaan of herstellen staat de opgeslagen tekst weer in het vak */}
              <form
                key={planTekst(eigenTekst, dienstTekst)}
                action={updateProjectPlan}
                className="space-y-3"
              >
                <input type="hidden" name="project_id" value={projectId} />
                <textarea
                  name="plan_text"
                  rows={12}
                  defaultValue={planTekst(eigenTekst, dienstTekst)}
                  className="input text-sm leading-relaxed"
                />
                <p className="text-xs text-jurgh-muted">
                  Eén stap per regel: titel, dan een streepje, dan de uitleg. De standaardtekst
                  pas je aan onder <Link href="/admin/diensten" className="underline">Diensten</Link>.
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                  {eigenTekst && (
                    <button
                      type="submit"
                      name="herstel"
                      value="1"
                      className="btn-ghost px-4 py-2 text-sm"
                    >
                      Standaard herstellen
                    </button>
                  )}
                  <button type="submit" className="btn-primary px-4 py-2 text-sm">
                    Opslaan
                  </button>
                </div>
              </form>
            </section>
          }
        />
      ),
    });
  }

  // Documenten zijn sinds de rechtenaanscherping admin-only.
  if (isAdmin) {
    tabs.splice(2, 0, {
      id: "documenten",
      label: "Documenten",
      content: (
        <TabSplit
          list={
            documents.length === 0 ? (
              <p className="text-sm text-jurgh-muted">Nog geen documenten bij dit project.</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-jurgh-border bg-jurgh-black/40 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-jurgh-text">{d.name}</p>
                      <span className="text-xs text-jurgh-muted">
                        {DOCUMENT_TYPE_LABEL[d.type as DocumentType]} · {formatDate(d.created_at)}
                      </span>
                    </div>
                    {d.url && (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost px-3 py-1.5"
                      >
                        Download
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )
          }
          form={
            <section className="card p-6">
              <SectionTitle>Document uploaden</SectionTitle>
              <DocumentUploadForm projectId={projectId} />
            </section>
          }
        />
      ),
    });
  }

  return (
    <div className="space-y-6">
      {/* ---------------- kop ---------------- */}
      <div className="card overflow-hidden">
        <div className="grid md:grid-cols-[280px_1fr]">
          <div className="relative aspect-[4/3] md:aspect-auto md:h-full">
            <CarThumb src={v?.photo_url} alt={project.title} />
            <VehiclePhotoButtons
              vehicleId={project.vehicle_id}
              projectId={projectId}
              hasPhoto={!!v?.photo_url}
            />
          </div>

          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin ? (
                <StatusDropdown projectId={projectId} current={status} />
              ) : (
                <StatusBadge status={status} />
              )}
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
              {!project.loaner_car && project.loaner_car_requested_at && (
                <Badge tone="amber">
                  🚗 Leenauto aangevraagd · {formatDateTime(project.loaner_car_requested_at)}
                </Badge>
              )}
              {!project.transport && project.transport_requested_at && (
                <Badge tone="amber">
                  🚛 Transport aangevraagd · {formatDateTime(project.transport_requested_at)}
                </Badge>
              )}
              {project.offorte_proposal_nr && (
                <Badge tone="neutral">📄 {project.offorte_proposal_nr.trim()}</Badge>
              )}
              {project.published_at ? (
                <Badge tone="green">👁 Zichtbaar voor klant</Badge>
              ) : (
                <Badge tone="amber">🔒 Niet gepubliceerd</Badge>
              )}
            </div>

            {/* gepubliceerd: geen blok meer, alleen twee kleine links */}
            {isAdmin && project.published_at && <PublishLinks projectId={projectId} />}

            <h1 className="mt-3 text-2xl font-bold text-jurgh-text">{project.title}</h1>
            <p className="mt-1 text-jurgh-muted">
              <VehicleLine make={v?.make} model={v?.model} plate={v?.license_plate} />
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Field
                label="Klant"
                value={c?.company_name ? `${c.name} (${c.company_name})` : c?.name}
              />
              {c?.phone && <Field label="Telefoon klant" value={c.phone} />}
              {c?.email && <Field label="E-mail klant" value={c.email} />}
              {v?.year && <Field label="Bouwjaar" value={String(v.year)} />}
              {v?.color && <Field label="Kleur" value={v.color} />}
              {v?.mileage != null && (
                <Field label="Km-stand" value={v.mileage.toLocaleString("nl-NL")} />
              )}
              {isAdmin ? (
                <>
                  <ProjectDateField
                    projectId={projectId}
                    field="appointment_date"
                    label="Inleverdatum"
                    value={project.appointment_date}
                  />
                  <ProjectDateField
                    projectId={projectId}
                    field="expected_delivery_date"
                    label="Verwachte oplevering"
                    value={project.expected_delivery_date}
                  />
                </>
              ) : (
                <>
                  <Field label="Inleverdatum" value={formatDate(project.appointment_date)} />
                  <Field
                    label="Verwachte oplevering"
                    value={formatDate(project.expected_delivery_date)}
                  />
                </>
              )}
              {isAdmin && <Field label="Prijs (excl. btw)" value={formatPrice(project.price)} />}
            </dl>

            {project.offorte_proposal_url && (
              <p className="mt-2 text-sm">
                <a
                  href={project.offorte_proposal_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-jurgh-red hover:underline"
                >
                  Bekijk de offerte in Offorte →
                </a>
              </p>
            )}

            <div className="mt-6">
              <StatusProgress status={status} />
            </div>

            <div className="mt-5">
              <Link href={`/passport/${project.vehicle_id}`} target="_blank" className="btn-ghost">
                🛡️ Detailing Passport exporteren
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* nog niet gepubliceerd: wél een blok, want dit is een oproep */}
      {isAdmin && !project.published_at && (
        <div className="panel p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-jurgh-muted">
            Zichtbaarheid voor de klant
          </h2>
          <PublishPanel
            projectId={projectId}
            publishedAt={project.published_at}
            customerEmail={c?.email ?? null}
          />
        </div>
      )}

      {project.customer_notes && (
        <div className="panel p-4 text-sm text-jurgh-muted">
          <span className="font-semibold text-jurgh-text">Bericht voor de klant: </span>
          {project.customer_notes}
        </div>
      )}

      {/* medewerkers komen hier om uren te loggen; dat tabblad staat open */}
      <Tabs tabs={tabs} initial={isMedewerker ? "uren" : "proces"} />
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

function Timeline({ history, remarks }: { history: any[]; remarks: any[] }) {
  type Item = { id: string; at: string; kind: "status" | "remark"; text: string; by?: string };
  const items: Item[] = [
    ...history.map((h: any) => ({
      id: "s" + h.id,
      at: h.created_at,
      kind: "status" as const,
      text: STATUS_LABEL[h.status as ProjectStatus] + (h.note ? ` — ${h.note}` : ""),
      by: h.profiles?.full_name || undefined,
    })),
    ...remarks.map((r: any) => ({
      id: "r" + r.id,
      at: r.created_at,
      kind: "remark" as const,
      text: r.body,
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  if (items.length === 0) {
    return <p className="text-sm text-jurgh-muted">Nog niets gebeurd op dit project.</p>;
  }

  return (
    <ol className="relative space-y-4 border-l border-jurgh-border pl-5">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className={`absolute -left-[1.45rem] top-1.5 h-2.5 w-2.5 rounded-full ${
              item.kind === "status" ? "bg-jurgh-red" : "bg-jurgh-border"
            }`}
          />
          <p className="text-sm text-jurgh-text">{item.text}</p>
          <p className="text-xs text-jurgh-muted">
            {formatDateTime(item.at)}
            {item.by ? ` · ${item.by}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}

import {
  getProject,
  getPhotos,
  getDocuments,
  getRemarks,
  getExtraWork,
  getExtraWorkCatalog,
  getServiceLink,
  vehicleTitle,
} from "@/lib/data";
import {
  projectTypeLabel,
  STATUS_LABEL,
  PHOTO_GROUPS,
  PHOTO_LABEL,
  DOCUMENT_TYPE_LABEL,
  EXTRA_WORK_STATUS_LABEL,
  PRICING_MODE_LABEL,
  formatDate,
  formatDateTime,
  formatPrice,
  priceInclBtw,
  afspraakAanstaand,
  werkActief,
  projectLopend,
  type ProjectStatus,
  type PhotoLabel,
  type DocumentType,
  type ExtraWorkStatus,
  type PricingMode,
} from "@/lib/constants";
import {
  CarThumb,
  StatusBadge,
  StatusProgress,
  Badge,
  EmptyState,
  VehicleLine,
} from "@/components/ui";
import { Tabs, type TabItem } from "@/components/Tabs";
import { ExtraWorkRespond } from "@/components/forms/StaffForms";
import { RequestOptionButton, RequestCatalogButton } from "@/components/forms/KlantForms";

// ============================================================
// Het dossier zoals de klant het ziet: bovenaan waar hij aan toe is,
// daaronder tabbladen. De admin- en medewerkerpagina blijven ongewijzigd.
// ============================================================

export async function KlantDossier({ projectId }: { projectId: string }) {
  const project = await getProject(projectId);
  if (!project) return <EmptyState title="Dit dossier is niet (meer) beschikbaar" />;

  const [photos, documents, remarks, extraWork, catalog, serviceLink] = await Promise.all([
    getPhotos(projectId),
    getDocuments(projectId),
    getRemarks(projectId),
    getExtraWork(projectId),
    getExtraWorkCatalog(),
    getServiceLink(project.type),
  ]);

  const v = project.vehicles;
  const c = project.customers;
  const status = project.status as ProjectStatus;
  const inclBtw = !c?.is_business;
  const toonPrijs = (value: number | null) =>
    formatPrice(inclBtw ? priceInclBtw(value) : value);

  // Meerwerk dat de klant mag zien; 'concept' en 'intern_akkoord' filtert RLS al weg.
  const meerwerk = extraWork as any[];
  const opmerkingen = (remarks as any[]).filter((r) => r.visible_to_customer);
  const heeftNieuws = meerwerk.length > 0 || opmerkingen.length > 0;

  // foto's die al bij een meerwerkregel horen (zelfde rij, twee plekken)
  const fotoBijMeerwerk = new Map<string, (typeof photos)[number]>();
  for (const p of photos) if (p.extra_work_id) fotoBijMeerwerk.set(p.extra_work_id, p);

  const aangevraagdeTitels = new Set(meerwerk.map((e) => e.title));
  const upsells = (catalog as any[]).filter((item) => !aangevraagdeTitels.has(item.title));

  const lopend = projectLopend(status);
  const toonLeenauto = lopend && !project.loaner_car && !project.loaner_car_requested_at;
  const toonTransport = lopend && !project.transport && !project.transport_requested_at;

  // ---------------- tabbladen ----------------
  const tabs: TabItem[] = [
    {
      id: "plan",
      label: "Plan van aanpak",
      content: (
        <div className="card space-y-3 p-6">
          <h2 className="text-lg font-bold text-jurgh-text">
            {projectTypeLabel(project.type)}
          </h2>
          {serviceLink?.plan_url ? (
            <>
              <p className="text-sm text-jurgh-muted">
                Hierin lees je precies welke stappen we zetten en wat je van ons mag verwachten.
              </p>
              <a
                href={serviceLink.plan_url}
                target="_blank"
                rel="noreferrer"
                className="btn-primary inline-flex"
              >
                Bekijk het plan van aanpak
              </a>
            </>
          ) : (
            <p className="text-sm text-jurgh-muted">
              Het plan van aanpak voor deze behandeling staat nog niet klaar. Je vindt het hier
              zodra het beschikbaar is.
            </p>
          )}
          {project.customer_notes && (
            <div className="rounded-xl border border-jurgh-border bg-jurgh-black/30 p-4">
              <p className="mb-1 text-xs uppercase tracking-wide text-jurgh-muted">
                Bericht van JURGH
              </p>
              <p className="whitespace-pre-line text-sm text-jurgh-text">{project.customer_notes}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "fotos",
      label: "Foto's",
      content: photos.length === 0 ? (
        <p className="text-sm text-jurgh-muted">
          Zodra we aan je auto beginnen, verschijnen hier de eerste foto's.
        </p>
      ) : (
        <div className="space-y-6">
          {PHOTO_GROUPS.map((groep) => {
            const inGroep = photos.filter((p) => groep.labels.includes(p.label as PhotoLabel));
            if (inGroep.length === 0) return null;
            return (
              <section key={groep.id}>
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-jurgh-text">
                  {groep.label}
                  <span className="text-sm font-normal text-jurgh-muted">({inGroep.length})</span>
                </h3>
                {(
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {inGroep.map((p) => (
                      <figure
                        key={p.id}
                        className="overflow-hidden rounded-xl border border-jurgh-border bg-jurgh-black/40"
                      >
                        {p.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.url}
                            alt={p.caption ?? PHOTO_LABEL[p.label as PhotoLabel]}
                            className="aspect-square w-full object-cover"
                          />
                        ) : (
                          <div className="aspect-square w-full" />
                        )}
                        {(p.caption || p.extra_work_id) && (
                          <figcaption className="space-y-1 p-2">
                            {p.extra_work_id && <Badge tone="amber">Extra werk</Badge>}
                            {p.caption && (
                              <p className="text-xs text-jurgh-muted">{p.caption}</p>
                            )}
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ),
    },
    {
      id: "extras",
      label: "Extra's & Bijzonderheden",
      dot: heeftNieuws,
      content: (
        <div className="space-y-6">
          {/* ---- aanvragen ---- */}
          {(toonLeenauto || toonTransport) && (
            <section className="card space-y-3 p-6">
              <h3 className="font-semibold text-jurgh-text">Iets nodig tijdens de behandeling?</h3>
              <div className="flex flex-col gap-2 sm:flex-row">
                {toonLeenauto && (
                  <RequestOptionButton
                    projectId={projectId}
                    kind="leenauto"
                    label="🚗 Leenauto aanvragen"
                  />
                )}
                {toonTransport && (
                  <RequestOptionButton
                    projectId={projectId}
                    kind="transport"
                    label="🚛 Transport aanvragen"
                  />
                )}
              </div>
              <p className="text-xs text-jurgh-muted">
                We nemen contact op om het af te stemmen; je aanvraag is nog geen bevestiging.
              </p>
            </section>
          )}

          {(project.loaner_car ||
            project.transport ||
            project.loaner_car_requested_at ||
            project.transport_requested_at) && (
            <div className="flex flex-wrap gap-2">
              {project.loaner_car && (
                <Badge tone="green">
                  🚗 Leenauto geregeld
                  {project.loaner_car_plate ? ` · ${project.loaner_car_plate}` : ""}
                </Badge>
              )}
              {!project.loaner_car && project.loaner_car_requested_at && (
                <Badge tone="amber">🚗 Leenauto aangevraagd</Badge>
              )}
              {project.transport && <Badge tone="green">🚛 Transport geregeld</Badge>}
              {!project.transport && project.transport_requested_at && (
                <Badge tone="amber">🚛 Transport aangevraagd</Badge>
              )}
            </div>
          )}

          {/* ---- meerwerk ---- */}
          {meerwerk.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-semibold text-jurgh-text">Extra werk</h3>
              <ul className="space-y-3">
                {meerwerk.map((e) => {
                  const foto = fotoBijMeerwerk.get(e.id);
                  return (
                    <li key={e.id} className="card overflow-hidden">
                      <div className="flex flex-col gap-4 p-4 sm:flex-row">
                        {foto?.url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={foto.url}
                            alt={e.title}
                            className="h-32 w-full rounded-xl object-cover sm:w-44"
                          />
                        )}
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-jurgh-text">{e.title}</span>
                            <Badge tone={e.status === "klant_akkoord" ? "green" : "neutral"}>
                              {EXTRA_WORK_STATUS_LABEL[e.status as ExtraWorkStatus] ?? e.status}
                            </Badge>
                          </div>
                          {e.description && (
                            <p className="text-sm text-jurgh-muted">{e.description}</p>
                          )}
                          <p className="text-sm text-jurgh-text">
                            {toonPrijs(e.price)}{" "}
                            <span className="text-jurgh-muted">
                              ({PRICING_MODE_LABEL[(e.pricing_mode as PricingMode) || "totaal"]}
                              {inclBtw ? ", incl. btw" : ", excl. btw"})
                            </span>
                          </p>
                          {e.status === "voorgesteld" && (
                            <ExtraWorkRespond id={e.id} projectId={projectId} />
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* ---- upsells ---- */}
          {lopend && upsells.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-semibold text-jurgh-text">Ook interessant</h3>
              <ul className="space-y-2">
                {upsells.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 rounded-xl border border-jurgh-border bg-jurgh-black/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-jurgh-text">{item.title}</p>
                      {item.description && (
                        <p className="text-sm text-jurgh-muted">{item.description}</p>
                      )}
                      <p className="mt-1 text-sm text-jurgh-muted">
                        vanaf {toonPrijs(item.price)}{" "}
                        {PRICING_MODE_LABEL[(item.pricing_mode as PricingMode) || "totaal"]}
                      </p>
                    </div>
                    <RequestCatalogButton projectId={projectId} catalogId={item.id} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ---- opmerkingen ---- */}
          {opmerkingen.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-semibold text-jurgh-text">Bijzonderheden</h3>
              <ul className="space-y-2">
                {opmerkingen.map((r) => (
                  <li key={r.id} className="rounded-xl border border-jurgh-border bg-jurgh-black/30 p-4">
                    <p className="text-sm text-jurgh-text">{r.body}</p>
                    <p className="mt-1 text-xs text-jurgh-muted">{formatDateTime(r.created_at)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* helemaal niets te melden: dan toch één zin */}
          {!toonLeenauto &&
            !toonTransport &&
            meerwerk.length === 0 &&
            opmerkingen.length === 0 &&
            (!lopend || upsells.length === 0) && (
              <p className="text-sm text-jurgh-muted">
                Er staan op dit moment geen extra's of bijzonderheden open.
              </p>
            )}
        </div>
      ),
    },
    {
      id: "documenten",
      label: "Documenten & links",
      content: (
        <div className="space-y-6">
          {documents.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-semibold text-jurgh-text">Documenten</h3>
              <ul className="space-y-2">
                {documents.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-jurgh-border bg-jurgh-black/30 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-jurgh-text">{d.name}</p>
                      <span className="text-xs text-jurgh-muted">
                        {DOCUMENT_TYPE_LABEL[d.type as DocumentType]} · {formatDate(d.created_at)}
                      </span>
                    </div>
                    {d.url && (
                      <a href={d.url} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5">
                        Openen
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(serviceLink?.website_url || serviceLink?.plan_url) && (
            <section className="space-y-3">
              <h3 className="font-semibold text-jurgh-text">Over deze behandeling</h3>
              <div className="flex flex-col gap-2 sm:flex-row">
              {serviceLink?.website_url && (
                <a
                  href={serviceLink.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost"
                >
                  Meer over {projectTypeLabel(project.type)}
                </a>
              )}
                {serviceLink?.plan_url && (
                  <a href={serviceLink.plan_url} target="_blank" rel="noreferrer" className="btn-ghost">
                    Plan van aanpak
                  </a>
                )}
              </div>
            </section>
          )}

          {documents.length === 0 && !serviceLink?.website_url && !serviceLink?.plan_url && (
            <p className="text-sm text-jurgh-muted">
              Hier verschijnen je offerte, factuur en certificaten zodra ze klaarstaan.
            </p>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ---------------- algemene info ---------------- */}
      <div className="card overflow-hidden">
        <div className="grid md:grid-cols-[300px_1fr]">
          <div className="aspect-[4/3] md:aspect-auto md:h-full">
            <CarThumb src={v?.photo_url} alt={vehicleTitle(v)} />
          </div>

          <div className="space-y-5 p-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-jurgh-red">
                {projectTypeLabel(project.type)}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-jurgh-text">{project.title}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-jurgh-muted">
                <VehicleLine make={v?.make} model={v?.model} plate={v?.license_plate} />
                {v?.mileage != null && <span>{v.mileage.toLocaleString("nl-NL")} km</span>}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-jurgh-muted">Status</p>
              <div className="mt-1.5">
                <StatusBadge status={status} large />
              </div>
            </div>

            <StatusProgress status={status} />

            {/* tijdlijn: de datum die er nú toe doet, staat vooraan */}
            <div className="grid gap-3 sm:grid-cols-2">
              <DatumVak
                label="Afspraak"
                value={formatDate(project.appointment_date)}
                uitgelicht={afspraakAanstaand(status)}
              />
              <DatumVak
                label="Verwachte oplevering"
                value={formatDate(project.expected_delivery_date)}
                uitgelicht={werkActief(status)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- tabbladen ---------------- */}
      <Tabs tabs={tabs} />
    </div>
  );
}

function DatumVak({
  label,
  value,
  uitgelicht,
}: {
  label: string;
  value: string;
  uitgelicht: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        uitgelicht
          ? "border-jurgh-red/40 bg-jurgh-red/10"
          : "border-jurgh-border bg-jurgh-black/30"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-jurgh-muted">{label}</p>
      <p
        className={`mt-0.5 font-semibold ${
          uitgelicht ? "text-jurgh-red" : "text-jurgh-text"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

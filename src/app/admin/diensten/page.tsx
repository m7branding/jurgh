import { listServiceLinks } from "@/lib/data";
import { SectionTitle } from "@/components/ui";
import { projectTypeLabel } from "@/lib/constants";
import { updateServiceLink, updateServicePlan } from "@/app/actions/diensten";
import { PlanVanAanpak } from "@/components/PlanVanAanpak";

export const dynamic = "force-dynamic";

export default async function AdminDienstenPage() {
  const links = (await listServiceLinks()) as any[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-jurgh-text">Diensten</h1>
        <p className="text-jurgh-muted">
          Per dienst één keer invullen. Elk project van dat type neemt het plan van aanpak en de
          links over; per project kun je het plan nog aanpassen.
        </p>
      </div>

      <SectionTitle>Per dienst</SectionTitle>
      <div className="space-y-4">
        {links.map((l) => {
          const regels = String(l.plan_text ?? "").split("\n").length;
          return (
            <div key={l.project_type} className="card space-y-5 p-5">
              <h2 className="font-semibold text-jurgh-text">{projectTypeLabel(l.project_type)}</h2>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* ---- plan van aanpak ---- */}
                <form action={updateServicePlan} className="space-y-2">
                  <input type="hidden" name="project_type" value={l.project_type} />
                  <label className="label">Plan van aanpak (tekst voor de klant)</label>
                  <textarea
                    name="plan_text"
                    rows={Math.max(6, regels + 2)}
                    defaultValue={l.plan_text ?? ""}
                    placeholder={"Intake & inspectie — We bekijken je auto samen…\nWassen & decontamineren — …"}
                    className="input text-sm leading-relaxed"
                  />
                  <p className="text-xs text-jurgh-muted">
                    Eén stap per regel: titel, dan een streepje, dan de uitleg. Puur ter
                    informatie; de klant leest dit als stappenplan van de behandeling.
                  </p>
                  <div className="flex justify-end">
                    <button type="submit" className="btn-ghost px-4 py-2 text-sm">
                      Plan opslaan
                    </button>
                  </div>
                </form>

                {/* ---- links ---- */}
                <form action={updateServiceLink} className="space-y-3">
                  <input type="hidden" name="project_type" value={l.project_type} />
                  <div>
                    <label className="label">Webpagina dienst</label>
                    <input
                      name="website_url"
                      type="url"
                      defaultValue={l.website_url ?? ""}
                      placeholder="https://jurgh.nl/…"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Plan van aanpak (document)</label>
                    <input
                      name="plan_url"
                      type="url"
                      defaultValue={l.plan_url ?? ""}
                      placeholder="https://…"
                      className="input"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="btn-ghost px-4 py-2 text-sm">
                      Links opslaan
                    </button>
                  </div>
                </form>
              </div>

              {l.plan_text && (
                <details className="rounded-xl border border-jurgh-border bg-jurgh-black/20 p-4">
                  <summary className="cursor-pointer text-sm font-medium text-jurgh-muted hover:text-jurgh-text">
                    Zo ziet de klant het
                  </summary>
                  <div className="mt-4">
                    <PlanVanAanpak text={l.plan_text} />
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

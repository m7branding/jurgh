import { listServiceLinks, listAllServiceMilestones } from "@/lib/data";
import { SectionTitle } from "@/components/ui";
import { projectTypeLabel } from "@/lib/constants";
import { updateServiceLink, updateServiceMilestones } from "@/app/actions/diensten";

export const dynamic = "force-dynamic";

export default async function AdminDienstenPage() {
  const [links, milestones] = await Promise.all([
    listServiceLinks() as Promise<any[]>,
    listAllServiceMilestones(),
  ]);

  const stappenPerDienst = new Map<string, string[]>();
  for (const m of milestones) {
    const lijst = stappenPerDienst.get(m.project_type) ?? [];
    lijst.push(m.title);
    stappenPerDienst.set(m.project_type, lijst);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-jurgh-text">Diensten</h1>
        <p className="text-jurgh-muted">
          Per dienst één keer invullen. Elk project van dat type neemt de stappen en links over.
        </p>
      </div>

      <SectionTitle>Per dienst</SectionTitle>
      <div className="space-y-4">
        {links.map((l) => {
          const stappen = stappenPerDienst.get(l.project_type) ?? [];
          return (
            <div key={l.project_type} className="card space-y-5 p-5">
              <h2 className="font-semibold text-jurgh-text">{projectTypeLabel(l.project_type)}</h2>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* ---- stappen van het plan van aanpak ---- */}
                <form action={updateServiceMilestones} className="space-y-2">
                  <input type="hidden" name="project_type" value={l.project_type} />
                  <label className="label">Stappen plan van aanpak</label>
                  <textarea
                    name="milestones"
                    rows={Math.max(5, stappen.length + 1)}
                    defaultValue={stappen.join("\n")}
                    placeholder={"Intake & inspectie\nWassen & decontamineren\n…"}
                    className="input font-mono text-sm leading-relaxed"
                  />
                  <p className="text-xs text-jurgh-muted">
                    Eén stap per regel, van boven naar beneden. Geaccepteerd meerwerk komt er per
                    project vanzelf achteraan. Pas je de volgorde aan terwijl er projecten lopen,
                    controleer dan bij die projecten even de huidige stap.
                  </p>
                  <div className="flex justify-end">
                    <button type="submit" className="btn-ghost px-4 py-2 text-sm">
                      Stappen opslaan
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

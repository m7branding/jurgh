import { listServiceLinks } from "@/lib/data";
import { SectionTitle } from "@/components/ui";
import { projectTypeLabel } from "@/lib/constants";
import { updateServiceLink } from "@/app/actions/diensten";

export const dynamic = "force-dynamic";

export default async function AdminDienstenPage() {
  const links = (await listServiceLinks()) as any[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-jurgh-text">Diensten</h1>
        <p className="text-jurgh-muted">
          Per dienst één keer invullen. Elk project van dat type toont deze links in het
          klantdossier, onder Plan van aanpak en Documenten &amp; links.
        </p>
      </div>

      <SectionTitle>Links per dienst</SectionTitle>
      <div className="space-y-4">
        {links.map((l) => (
          <form key={l.project_type} action={updateServiceLink} className="card space-y-3 p-5">
            <input type="hidden" name="project_type" value={l.project_type} />
            <h2 className="font-semibold text-jurgh-text">{projectTypeLabel(l.project_type)}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
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
                <label className="label">Plan van aanpak</label>
                <input
                  name="plan_url"
                  type="url"
                  defaultValue={l.plan_url ?? ""}
                  placeholder="https://…"
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-ghost px-4 py-2 text-sm">
                Opslaan
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}

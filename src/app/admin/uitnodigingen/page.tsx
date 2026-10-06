import Link from "next/link";
import { listPortalInvites } from "@/lib/data";
import { SectionTitle, EmptyState, Badge } from "@/components/ui";
import { formatDateTime } from "@/lib/constants";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  uitnodiging: "Uitnodiging",
  melding: "Melding",
};

export default async function AdminUitnodigingenPage() {
  const invites = (await listPortalInvites()) as any[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-jurgh-text">Uitnodigingen</h1>
        <p className="text-jurgh-muted">
          Wat er bij het publiceren van een project naar de klant zou gaan.
        </p>
      </div>

      <div className="card border-jurgh-gold/40 bg-jurgh-gold/5 p-4 text-sm text-jurgh-muted">
        <span className="font-semibold text-jurgh-text">Testfase — er wordt niets gemaild.</span>{" "}
        De inloglink wordt hier bewaard zodat je 'm zelf kunt uitproberen. Zo'n link is een sleutel
        tot het dossier van die klant: deel 'm niet, en hij verloopt vanzelf.
      </div>

      <SectionTitle>Laatste {invites.length}</SectionTitle>
      {invites.length === 0 ? (
        <EmptyState
          title="Nog niets gepubliceerd"
          description="Publiceer een project om de klant toegang te geven."
        />
      ) : (
        <ul className="space-y-3">
          {invites.map((i) => (
            <li key={i.id} className="card space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={i.kind === "uitnodiging" ? "red" : "neutral"}>
                  {KIND_LABEL[i.kind] ?? i.kind}
                </Badge>
                <Badge
                  tone={i.status === "drooggelogd" ? "amber" : i.status === "verstuurd" ? "green" : "red"}
                >
                  {i.status}
                </Badge>
                <span className="text-xs text-jurgh-muted">{formatDateTime(i.created_at)}</span>
              </div>

              <p className="text-sm text-jurgh-text">
                {i.customers?.name ?? "Onbekende klant"} · <span className="font-mono">{i.email}</span>
              </p>
              {i.message && <p className="text-sm text-jurgh-muted">{i.message}</p>}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {i.projects?.id && (
                  <Link
                    href={`/admin/projecten/${i.projects.id}`}
                    className="text-sm text-jurgh-red hover:underline"
                  >
                    Open project
                  </Link>
                )}
                {i.action_link && (
                  <a
                    href={i.action_link}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost px-3 py-1.5 text-xs"
                  >
                    Inloglink openen
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

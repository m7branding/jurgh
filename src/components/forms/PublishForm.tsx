"use client";

import { useFormState, useFormStatus } from "react-dom";
import { publishProject, unpublishProject } from "@/app/actions/publish";
import { formatDateTime } from "@/lib/constants";

function Submit({ label, busy, variant = "primary" }: { label: string; busy: string; variant?: "primary" | "ghost" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={variant === "primary" ? "btn-primary" : "btn-ghost"} disabled={pending}>
      {pending ? busy : label}
    </button>
  );
}

export function PublishPanel({
  projectId,
  publishedAt,
  customerEmail,
}: {
  projectId: string;
  publishedAt: string | null;
  customerEmail: string | null;
}) {
  const [state, action] = useFormState(publishProject, {} as { error?: string; ok?: boolean });

  if (publishedAt) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-jurgh-text">
          Zichtbaar voor de klant sinds{" "}
          <span className="font-semibold">{formatDateTime(publishedAt)}</span>.
        </p>
        <form
          action={unpublishProject}
          onSubmit={(e) => {
            if (!confirm("Project intrekken? De klant kan het dossier daarna niet meer zien.")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="project_id" value={projectId} />
          <Submit label="Intrekken" busy="Intrekken…" variant="ghost" />
        </form>
        <p className="text-xs text-jurgh-muted">
          Intrekken raakt de status van het project niet — het dossier verdwijnt alleen uit het
          zicht van de klant.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="project_id" value={projectId} />
      <p className="text-sm text-jurgh-muted">
        De klant ziet dit project nog niet. Bij publiceren krijgt {customerEmail || "de klant"} een
        account en een inloglink voor het dossier.
      </p>
      {state?.error && (
        <p className="rounded-lg border border-jurgh-red/40 bg-jurgh-red/10 px-3 py-2 text-sm text-jurgh-red">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg border border-jurgh-green/40 bg-jurgh-green/10 px-3 py-2 text-sm text-jurgh-green">
          Gepubliceerd. De inloglink staat klaar onder Uitnodigingen — er is nog niets gemaild.
        </p>
      )}
      <Submit label="Publiceren naar klant" busy="Publiceren…" />
      <p className="text-xs text-jurgh-muted">
        Testfase: er wordt geen mail verstuurd. De inloglink wordt gelogd zodat je 'm zelf kunt
        uitproberen.
      </p>
    </form>
  );
}

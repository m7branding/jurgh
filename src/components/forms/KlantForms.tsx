"use client";

import { useFormStatus } from "react-dom";
import { requestProjectOption, requestCatalogItem } from "@/app/actions/klant";

function Knop({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-ghost w-full justify-between sm:w-auto" disabled={pending}>
      {pending ? busy : label}
    </button>
  );
}

/** Leenauto of transport aanvragen. Jurgh kent het daarna toe. */
export function RequestOptionButton({
  projectId,
  kind,
  label,
}: {
  projectId: string;
  kind: "leenauto" | "transport";
  label: string;
}) {
  return (
    <form action={requestProjectOption}>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="kind" value={kind} />
      <Knop label={label} busy="Aanvragen…" />
    </form>
  );
}

/** Een optie uit de cataloog aanvragen; Jurgh maakt er een voorstel van. */
export function RequestCatalogButton({
  projectId,
  catalogId,
}: {
  projectId: string;
  catalogId: string;
}) {
  return (
    <form action={requestCatalogItem}>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="catalog_id" value={catalogId} />
      <Knop label="Aanvragen" busy="Aanvragen…" />
    </form>
  );
}

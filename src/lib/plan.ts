// ============================================================
// Plan van aanpak: de stappen van de dienst, met daarachter het meerwerk
// dat de klant heeft geaccepteerd. Gedeeld door het klantdossier en de
// adminpagina, zodat ze altijd dezelfde lijst en dezelfde voortgang tonen.
// ============================================================

export type PlanStep = {
  key: string;
  title: string;
  kind: "stap" | "meerwerk";
};

/** Meerwerk telt pas mee in het plan als de klant het heeft geaccepteerd. */
const MEERWERK_IN_PLAN = ["klant_akkoord", "uitgevoerd"];

export function buildPlanSteps(
  template: { id: string; title: string; position: number }[],
  extraWork: { id: string; title: string; status: string; decided_at?: string | null; created_at?: string }[]
): PlanStep[] {
  const stappen: PlanStep[] = [...template]
    .sort((a, b) => a.position - b.position)
    .map((t) => ({ key: `s-${t.id}`, title: t.title, kind: "stap" as const }));

  const meerwerk: PlanStep[] = extraWork
    .filter((e) => MEERWERK_IN_PLAN.includes(e.status))
    .sort((a, b) =>
      String(a.decided_at ?? a.created_at ?? "").localeCompare(String(b.decided_at ?? b.created_at ?? ""))
    )
    .map((e) => ({ key: `m-${e.id}`, title: e.title, kind: "meerwerk" as const }));

  return [...stappen, ...meerwerk];
}

/**
 * Voortgang in procenten op basis van de stappen. null als er geen stappen
 * zijn of nog geen stap is aangewezen — dan valt de balk terug op de status.
 */
export function planProgress(
  steps: PlanStep[],
  currentStep: number | null,
  afgerond = false
): number | null {
  if (afgerond) return 100;
  if (steps.length === 0 || currentStep == null) return null;
  const huidig = Math.max(0, Math.min(currentStep, steps.length - 1));
  // de huidige stap is bezig, dus telt voor de helft; 100% pas bij afronden
  return Math.round(((huidig + 0.5) / steps.length) * 100);
}

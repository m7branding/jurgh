import { setCurrentStep } from "@/app/actions/projects";
import { StatusProgress, ProgressBar } from "@/components/ui";
import type { PlanStep } from "@/lib/plan";
import type { ProjectStatus } from "@/lib/constants";

// ============================================================
// Plan van aanpak als stappenlijn.
// Voorgaande stappen zijn gedempt met een vinkje, de huidige heeft een rand,
// de rest staat nog open. In de admin is elke stap aan te klikken.
// ============================================================

export function PlanSteps({
  steps,
  current,
  projectId,
  editable = false,
}: {
  steps: PlanStep[];
  current: number | null;
  projectId?: string;
  editable?: boolean;
}) {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-jurgh-muted">
        {editable
          ? "Voor deze dienst zijn nog geen stappen ingesteld. Dat doe je onder Diensten."
          : "Het stappenplan voor deze behandeling staat nog niet klaar."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {steps.map((step, i) => {
          const fase = current == null ? "open" : i < current ? "klaar" : i === current ? "nu" : "open";
          return (
            <li key={step.key}>
              <StapRegel
                index={i}
                step={step}
                fase={fase}
                projectId={projectId}
                editable={editable}
              />
            </li>
          );
        })}
      </ol>

      {editable && current != null && projectId && (
        <form action={setCurrentStep}>
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="step" value="" />
          <button type="submit" className="text-xs text-jurgh-muted hover:text-jurgh-text hover:underline">
            Huidige stap wissen
          </button>
        </form>
      )}
    </div>
  );
}

function StapRegel({
  index,
  step,
  fase,
  projectId,
  editable,
}: {
  index: number;
  step: PlanStep;
  fase: "klaar" | "nu" | "open";
  projectId?: string;
  editable: boolean;
}) {
  const vak = `flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
    fase === "nu"
      ? "border-jurgh-red bg-jurgh-red/5 ring-1 ring-jurgh-red/40"
      : fase === "klaar"
        ? "border-jurgh-border bg-jurgh-black/20 opacity-60"
        : "border-jurgh-border bg-jurgh-card"
  }`;

  const inhoud = (
    <>
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          fase === "nu"
            ? "bg-jurgh-red text-white"
            : fase === "klaar"
              ? "bg-jurgh-green/20 text-jurgh-green"
              : "border border-jurgh-border text-jurgh-muted"
        }`}
      >
        {fase === "klaar" ? "✓" : index + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm font-medium ${
            fase === "klaar" ? "text-jurgh-muted line-through decoration-jurgh-muted/40" : "text-jurgh-text"
          }`}
        >
          {step.title}
        </span>
        {step.kind === "meerwerk" && (
          <span className="text-xs text-jurgh-gold">Extra werk · geaccepteerd</span>
        )}
      </span>
      {fase === "nu" && (
        <span className="text-xs font-semibold uppercase tracking-wide text-jurgh-red">Nu bezig</span>
      )}
    </>
  );

  if (!editable || !projectId) return <div className={vak}>{inhoud}</div>;

  return (
    <form action={setCurrentStep}>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="step" value={index} />
      <button
        type="submit"
        title={fase === "nu" ? "Dit is de huidige stap" : "Maak dit de huidige stap"}
        className={`${vak} hover:border-jurgh-red/60`}
      >
        {inhoud}
      </button>
    </form>
  );
}

/**
 * Voortgangsbalk die de stappen volgt zodra er een huidige stap is; anders
 * valt hij terug op de projectstatus, zodat een project zonder stappen niet
 * ineens op 0% staat.
 */
export function PlanProgress({
  percent,
  status,
}: {
  percent: number | null;
  status: ProjectStatus;
}) {
  if (percent == null) return <StatusProgress status={status} />;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-jurgh-muted">
        <span>Voortgang</span>
        <span className="text-jurgh-text">{percent}%</span>
      </div>
      <ProgressBar value={percent} />
    </div>
  );
}

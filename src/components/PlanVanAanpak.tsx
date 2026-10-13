import { parsePlan } from "@/lib/plan";

// ============================================================
// Plan van aanpak als leesbare tekst: genummerde stappen met uitleg.
// Puur ter informatie — geen huidige stap, niets aan te klikken.
// ============================================================

export function PlanVanAanpak({ text }: { text: string | null | undefined }) {
  const stappen = parsePlan(text);

  if (stappen.length === 0) {
    return (
      <p className="text-sm text-jurgh-muted">
        Het stappenplan voor deze behandeling staat nog niet klaar.
      </p>
    );
  }

  return (
    <ol className="space-y-0">
      {stappen.map((stap, i) => (
        <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
          {/* verbindingslijn naar de volgende stap */}
          {i < stappen.length - 1 && (
            <span aria-hidden className="absolute left-[13px] top-8 bottom-0 w-px bg-jurgh-border" />
          )}
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-jurgh-border text-xs font-bold text-jurgh-muted">
            {i + 1}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-jurgh-text">{stap.title}</p>
            {stap.uitleg && (
              <p className="mt-1 text-sm leading-relaxed text-jurgh-muted">{stap.uitleg}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addWorkLog } from "@/app/actions/projects";
import { WORK_TYPES } from "@/lib/constants";

export type LogProjectOption = { id: string; label: string };

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full py-3" disabled={pending}>
      {pending ? "Opslaan…" : "Uren loggen"}
    </button>
  );
}

export function QuickLogFab({
  projects,
  defaultProjectId,
}: {
  projects: LogProjectOption[];
  defaultProjectId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(addWorkLog, {} as { error?: string; ok?: boolean });
  const formRef = useRef<HTMLFormElement>(null);

  // Na succesvol loggen: formulier leegmaken zodat je direct nog een log kunt maken.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  // Lock body scroll wanneer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Zwevende + knop in de thumb-zone (rechtsonder) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Snel uren loggen"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-jurgh-red px-5 py-4 font-semibold text-white shadow-glow transition hover:bg-jurgh-redDark active:scale-95"
      >
        <span className="text-xl leading-none">+</span>
        <span className="hidden sm:inline">Uren loggen</span>
      </button>

      {!open ? null : (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* sheet / modal */}
          <div className="card relative z-10 w-full max-w-md rounded-b-none rounded-t-2xl p-6 sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-jurgh-text">Snel uren loggen</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Sluiten"
                className="rounded-lg px-2 py-1 text-jurgh-muted hover:text-jurgh-text"
              >
                ✕
              </button>
            </div>

            <form ref={formRef} action={action} className="space-y-3">
              <div>
                <label className="label">Project / auto</label>
                <select
                  name="project_id"
                  required
                  defaultValue={defaultProjectId ?? ""}
                  className="input"
                >
                  <option value="" disabled>
                    Kies een project…
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Werkzaamheid</label>
                  <select name="work_type" className="input" defaultValue="wassen">
                    {WORK_TYPES.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Uren</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    name="hours"
                    required
                    className="input"
                    placeholder="1.5"
                  />
                </div>
              </div>

              <div>
                <label className="label">Omschrijving (optioneel)</label>
                <input name="description" className="input" placeholder="Wat is er gedaan?" />
              </div>

              <input type="hidden" name="log_date" value={new Date().toISOString().slice(0, 10)} />

              {state?.error && <p className="text-sm text-jurgh-red">{state.error}</p>}
              {state?.ok && (
                <p className="text-sm text-jurgh-green">Uren gelogd ✓ — je kunt direct nog een log toevoegen.</p>
              )}

              <SubmitBtn />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-ghost w-full"
              >
                Sluiten
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

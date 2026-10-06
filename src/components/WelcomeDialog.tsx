"use client";

import { useEffect, useState } from "react";
import { markWelcomeSeen } from "@/app/actions/klant";

// Twee welkomstschermen: één bij de allereerste keer inloggen, één bij het
// tweede bezoek. Daarna niets meer. De teller staat op het profiel, dus het
// werkt ook als de klant op een ander apparaat inlogt.

export type WelcomeVariant = "eerste" | "terug";

export function WelcomeDialog({
  variant,
  name,
}: {
  variant: WelcomeVariant | null;
  name: string;
}) {
  const [open, setOpen] = useState(Boolean(variant));

  useEffect(() => {
    if (!variant) return;
    // meteen afvinken: het scherm is getoond, ook als de klant wegklikt
    void markWelcomeSeen();
  }, [variant]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!variant || !open) return null;

  const firstName = name?.split(" ")[0] || "daar";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welkom-titel"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-2xl border-t border-jurgh-border bg-jurgh-card shadow-2xl sm:rounded-2xl sm:border"
      >
        <div className="relative p-7">
          <p className="text-sm uppercase tracking-wide text-jurgh-red">JURGH Car Dossier</p>

          {variant === "eerste" ? (
            <>
              <h2 id="welkom-titel" className="mt-1 text-2xl font-black text-jurgh-text">
                Welkom, {firstName}
              </h2>
              <p className="mt-3 text-jurgh-muted">
                Dit is jouw dossier. Hier volg je de behandeling van je auto van begin tot eind —
                je hoeft nergens meer achteraan te bellen.
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-jurgh-muted">
                <li className="flex gap-2.5">
                  <span aria-hidden>📋</span>
                  <span>
                    <span className="font-semibold text-jurgh-text">Plan van aanpak</span> — wat we
                    precies gaan doen aan je auto.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden>📸</span>
                  <span>
                    <span className="font-semibold text-jurgh-text">Foto's</span> vanuit de
                    werkplaats: voor, tijdens en het resultaat.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden>➕</span>
                  <span>
                    <span className="font-semibold text-jurgh-text">Extra's</span> — leenauto of
                    transport aanvragen, en meerwerk goedkeuren of afwijzen.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden>📄</span>
                  <span>
                    <span className="font-semibold text-jurgh-text">Documenten</span> zoals je
                    offerte en factuur, altijd terug te vinden.
                  </span>
                </li>
              </ul>
              <p className="mt-4 text-sm text-jurgh-muted">
                Inloggen gaat voortaan zonder wachtwoord: je vult je e-mailadres in en krijgt een
                link toegestuurd.
              </p>
            </>
          ) : (
            <>
              <h2 id="welkom-titel" className="mt-1 text-2xl font-black text-jurgh-text">
                Welkom terug, {firstName}
              </h2>
              <p className="mt-3 text-jurgh-muted">
                Hier volg je live de voortgang van je auto: behandelingen, foto's vanuit de
                werkplaats en al je documenten op één plek.
              </p>
            </>
          )}

          <button type="button" onClick={() => setOpen(false)} className="btn-primary mt-6 w-full">
            {variant === "eerste" ? "Aan de slag" : "Naar mijn dossier"}
          </button>
        </div>

        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-jurgh-red/20 blur-3xl" />
      </div>
    </div>
  );
}

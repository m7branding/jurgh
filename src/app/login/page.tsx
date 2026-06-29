"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signIn } from "./actions";
import { Logo } from "@/components/ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full py-3" disabled={pending}>
      {pending ? "Bezig met inloggen…" : "Inloggen"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, { error: "" } as { error: string });

  return (
    <main data-theme="light" className="relative flex min-h-screen items-center justify-center px-6 py-12">
      {/* Geblurde showroom-achtergrond (asset: /public/login-bg.avif) */}
      <div className="login-bg" aria-hidden />
      <div className="login-bg-overlay" aria-hidden />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo height={34} />
        </div>

        <div className="card p-8">
          <h1 className="text-xl font-bold text-jurgh-text">Welkom terug</h1>
          <p className="mt-1 text-sm text-jurgh-muted">Log in op het JURGH Detailing Portal.</p>

          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">
                E-mailadres
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="naam@voorbeeld.nl"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Wachtwoord
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input"
                placeholder="••••••••"
              />
            </div>

            {state?.error ? (
              <p className="rounded-lg border border-jurgh-red/40 bg-jurgh-red/10 px-3 py-2 text-sm text-jurgh-red">
                {state.error}
              </p>
            ) : null}

            <SubmitButton />
          </form>
        </div>

        <p className="mt-6 text-center text-xs font-medium text-jurgh-muted">
          Nog geen toegang? Neem contact op met JURGH Car Detailing.
        </p>
      </div>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile, homePathForRole } from "@/lib/auth";
import { Logo, Check } from "@/components/ui";

export default async function HomePage() {
  const profile = await getSessionProfile();
  if (profile) redirect(homePathForRole(profile.role));

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <Logo className="text-lg" />
        <Link href="/login" className="btn-ghost">
          Inloggen
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-start justify-center py-16">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-jurgh-border bg-white/5 px-3 py-1 text-xs font-medium text-jurgh-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-jurgh-red" />
          JURGH Car Dossier — Vehicle Care Passport
        </span>
        <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
          Het digitale dossier voor <span className="text-jurgh-red">jouw auto</span>.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-jurgh-muted">
          Volg elke behandeling, foto en document op één plek. Premium detailing,
          glascoating en Paint Protection Film — volledig transparant, van afspraak
          tot oplevering.
        </p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            "Live projectstatus en voortgang",
            "Foto-updates vanuit de werkplaats",
            "Offertes, facturen & certificaten",
            "Complete behandelhistorie per auto",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-white">
              <Check /> {f}
            </li>
          ))}
        </ul>

        <Link href="/login" className="btn-primary mt-10 px-6 py-3 text-base">
          Naar mijn dossier
        </Link>
      </section>

      <footer className="border-t border-jurgh-border py-6 text-sm text-jurgh-muted">
        © {new Date().getFullYear()} JURGH Car Detailing — Klantenportaal
      </footer>
    </main>
  );
}

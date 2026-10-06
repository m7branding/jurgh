// Regels rond publiceren die geen server action zijn.
// Apart gehouden omdat in een "use server"-bestand élke export async moet zijn.

/**
 * Testfase: de inloglink wordt gelogd in plaats van gemaild, zodat de hele
 * flow te testen is zonder mailserver. Zet PORTAL_MAIL_DRY_RUN=false pas als
 * er een mailprovider is ingericht.
 */
export function isMailDryRun(): boolean {
  return process.env.PORTAL_MAIL_DRY_RUN !== "false";
}

/**
 * Reden waarom er niet naar dit adres gepubliceerd kan worden, of null als
 * het in orde is. Adressen uit de testfase (.invalid) worden hard geweigerd.
 */
export function emailProblem(email: string | null | undefined): string | null {
  const value = String(email ?? "").trim();
  if (!value) return "Deze klant heeft nog geen e-mailadres.";
  if (/\.invalid$/i.test(value)) {
    return "Deze klant heeft nog een testadres (.invalid). Vul eerst het echte e-mailadres in.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return "Dit e-mailadres klopt niet.";
  return null;
}

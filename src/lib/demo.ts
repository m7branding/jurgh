// ============================================================
// Demo-accounts: om het klantportaal te laten zien. Ze gedragen zich als een
// gewone klant, alleen komt het welkomstscherm bij elke login terug.
// ============================================================

export const DEMO_ACCOUNTS = ["demo@jurgh.test"];

export function isDemoAccount(email: string | null | undefined): boolean {
  return Boolean(email && DEMO_ACCOUNTS.includes(email.trim().toLowerCase()));
}

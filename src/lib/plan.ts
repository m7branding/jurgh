// ============================================================
// Plan van aanpak: puur informatie voor de klant, geen functionaliteit.
// Per dienst een standaardtekst, per project aan te passen. Opgeslagen als
// platte tekst, één stap per regel: "Titel — uitleg".
// ============================================================

export type PlanStap = {
  title: string;
  uitleg: string | null;
};

/** Scheidingsteken tussen titel en uitleg; een gewoon streepje mag ook. */
const SCHEIDING = /\s+[—–-]\s+/;

export function parsePlan(text: string | null | undefined): PlanStap[] {
  return String(text ?? "")
    .split("\n")
    .map((regel) => regel.trim())
    .filter(Boolean)
    .map((regel) => {
      const match = SCHEIDING.exec(regel);
      if (!match) return { title: regel, uitleg: null };
      return {
        title: regel.slice(0, match.index).trim(),
        uitleg: regel.slice(match.index + match[0].length).trim() || null,
      };
    });
}

/** Wat de klant ziet: de eigen tekst van het project, anders die van de dienst. */
export function planTekst(
  projectText: string | null | undefined,
  dienstText: string | null | undefined
): string {
  return (projectText?.trim() ? projectText : dienstText) ?? "";
}

/** Tekst uit een formulier gelijktrekken: geen lege regels, geen witruimte eromheen. */
export function normaliseerPlan(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((regel) => regel.trim())
    .filter(Boolean)
    .join("\n");
}

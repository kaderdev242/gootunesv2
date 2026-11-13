/** Périodes de la Rétro (utilisable côté client et serveur). */
export type RetroPeriod = "annee" | "mois" | "tout";

export const RETRO_PERIODS: { value: RetroPeriod; label: string }[] = [
  { value: "annee", label: "Cette année" },
  { value: "mois", label: "Ce mois-ci" },
  { value: "tout", label: "Depuis le début" },
];

export function parsePeriod(value: string | undefined): RetroPeriod {
  return value === "mois" || value === "tout" ? value : "annee";
}

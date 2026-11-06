import {
  currencyCodeForCountry,
  fcfaToLocal,
  usesCdf,
} from "@/lib/currency";

/**
 * Montant court à partir de 10 000 : « 12,5K », puis « 1,25M » dès le million.
 * Sous 10 000, le montant exact reste affiché (« 1 500 »).
 * Renvoie null quand le format exact s'applique.
 */
function compactAmount(value: number): string | null {
  const abs = Math.abs(value);
  if (abs < 10_000) return null;
  const sign = value < 0 ? "-" : "";
  const fmt = (n: number, digits: number) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits })
      .format(n)
      .replace(/\u202f/g, "\u00a0");
  if (abs >= 1_000_000) {
    // Pas d'arrondi vers le haut qui afficherait « 1000K » sous le million.
    return `${sign}${fmt(Math.floor(abs / 10_000) / 100, 2)}M`;
  }
  const k = Math.floor(abs / 100) / 10;
  return k >= 1000 ? `${sign}1M` : `${sign}${fmt(k, 1)}K`;
}

/** Nombre court pour les compteurs (écoutes, comptes) : « 12,8K », « 1,2M ». */
export function formatCount(value: number) {
  return (
    compactAmount(value) ??
    new Intl.NumberFormat("fr-FR").format(value).replace(/\u202f/g, "\u00a0")
  );
}

/** Format FCFA (legacy / admin / emails plateforme). */
export function formatFcfa(amount: number) {
  const short = compactAmount(amount);
  if (short) return `${short}\u00a0FCFA`;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\u202f/g, "\u00a0") // espace fine absente de la police Outfit
    .replace("XAF", "FCFA");
}

/**
 * Affiche un montant stocké en FCFA dans la devise du pays.
 * RDC (CD) → Franc congolais (CDF) ; sinon FCFA.
 */
export function formatMoney(
  amountFcfa: number,
  country?: string | null,
) {
  if (usesCdf(country)) {
    const local = fcfaToLocal(amountFcfa, country);
    const short = compactAmount(local);
    if (short) return `${short}\u00a0FC`;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "CDF",
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    })
      .format(local)
      .replace(/\u202f/g, "\u00a0")
      .replace("CDF", "FC");
  }
  return formatFcfa(amountFcfa);
}

/** Alias explicite. */
export function formatAmountForCountry(
  amountFcfa: number,
  country?: string | null,
) {
  return formatMoney(amountFcfa, country);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds == null || Number.isNaN(seconds) || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Durée totale d'un album ou d'une playlist : « 19 min », « 1 h 05 ». */
export function formatTotalDuration(seconds: number | null | undefined) {
  if (seconds == null || Number.isNaN(seconds) || seconds <= 0) return "—";
  const totalMin = Math.max(1, Math.round(seconds / 60));
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

/** Relatif court : Maintenant, 2 h, 1 j… */
export function formatRelativeShort(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 2) return "Maintenant";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} j`;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(iso));
}

export { currencyCodeForCountry };

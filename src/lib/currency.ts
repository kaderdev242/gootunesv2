import type { CountryCode } from "@/lib/constants";
import { MIN_RELEASE_PRICE_FCFA } from "@/lib/constants";

/**
 * Source de vérité métier = FCFA (colonnes *_fcfa).
 * Affichage / payin MBIYO : CDF pour la RDC (CD).
 *
 * Référence : 500 FCFA = 2 012,79 Franc congolais.
 */
export const FCFA_TO_CDF_RATE = 2012.79 / 500;

export function usesCdf(country: string | null | undefined): boolean {
  return country === "CD";
}

/** Convertit un montant FCFA vers la devise d’affichage du pays. */
export function fcfaToLocal(
  amountFcfa: number,
  country: string | null | undefined,
): number {
  if (!Number.isFinite(amountFcfa)) return 0;
  if (usesCdf(country)) {
    return Math.round(amountFcfa * FCFA_TO_CDF_RATE * 100) / 100;
  }
  return amountFcfa;
}

/** Convertit un montant saisi en devise locale vers FCFA (stockage). */
export function localToFcfa(
  amountLocal: number,
  country: string | null | undefined,
): number {
  if (!Number.isFinite(amountLocal)) return 0;
  if (usesCdf(country)) {
    return Math.max(0, Math.round(amountLocal / FCFA_TO_CDF_RATE));
  }
  return Math.max(0, Math.round(amountLocal));
}

/** Montant entier pour l’API MBIYO (payin / payout). */
export function toMbiyoPayAmount(
  amountFcfa: number,
  country: string | null | undefined,
): number {
  if (usesCdf(country)) {
    return Math.round(amountFcfa * FCFA_TO_CDF_RATE);
  }
  return Math.round(amountFcfa);
}

export function currencyCodeForCountry(
  country: string | null | undefined,
): "CDF" | "XAF" {
  return usesCdf(country) ? "CDF" : "XAF";
}

/** Libellé court pour labels UI. */
export function currencyLabelForCountry(
  country: string | null | undefined,
): string {
  return usesCdf(country) ? "FC" : "FCFA";
}

/** Libellé long. */
export function currencyNameForCountry(
  country: string | null | undefined,
): string {
  return usesCdf(country) ? "Franc congolais" : "FCFA";
}

export function minReleasePriceLocal(
  country: string | null | undefined,
): number {
  return fcfaToLocal(MIN_RELEASE_PRICE_FCFA, country);
}

export function isCountryCodeCurrency(
  code: string | null | undefined,
): code is CountryCode {
  return Boolean(code && ["CG", "CD", "CI", "CM", "SN"].includes(code));
}

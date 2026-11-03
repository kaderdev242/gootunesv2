export const COUNTRIES = [
  { code: "CG", label: "Congo" },
  { code: "CD", label: "RDC" },
  { code: "CI", label: "Côte d'Ivoire" },
  { code: "CM", label: "Cameroun" },
  { code: "SN", label: "Sénégal" },
  { code: "BF", label: "Burkina Faso" },
  { code: "BJ", label: "Bénin" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export { MUSIC_GENRES, GENRES, isMusicGenre, type MusicGenre } from "@/lib/genres";

export const MOBILE_MONEY_METHODS = [
  { id: "mtn", label: "MTN Mobile Money" },
  { id: "orange", label: "Orange Money" },
  { id: "wave", label: "Wave" },
  { id: "airtel", label: "Airtel Money" },
  { id: "vodacom", label: "Vodacom M-Pesa" },
  { id: "moov", label: "Moov Money" },
  { id: "africell", label: "Africell Money" },
  { id: "mpesa", label: "M-Pesa" },
  { id: "free", label: "Free Money" },
  { id: "coris", label: "Coris Money" },
  { id: "celtiis", label: "Celtiis Cash" },
] as const;

export type MobileMoneyMethodId = (typeof MOBILE_MONEY_METHODS)[number]["id"];

/**
 * Opérateurs par pays — alignés MBIYOPAY
 * @see https://dashboard.mbiyo.africa/docs/reference/merchant/payin
 */
export const OPERATORS_BY_COUNTRY: Record<
  CountryCode,
  readonly MobileMoneyMethodId[]
> = {
  CG: ["mtn"],
  CD: ["vodacom", "airtel", "orange", "africell"],
  CI: ["orange", "mtn", "wave", "moov"],
  CM: ["mtn", "orange"],
  SN: ["orange", "free", "wave"],
  BF: ["orange", "moov", "coris"],
  BJ: ["mtn", "moov", "celtiis"],
};

export function getCountryLabel(code: string | null | undefined): string {
  const found = COUNTRIES.find((c) => c.code === code);
  return found?.label ?? code ?? "—";
}

export function getOperatorsForCountry(code: string | null | undefined) {
  const ids =
    code && code in OPERATORS_BY_COUNTRY
      ? OPERATORS_BY_COUNTRY[code as CountryCode]
      : OPERATORS_BY_COUNTRY.CG;
  return MOBILE_MONEY_METHODS.filter((m) => ids.includes(m.id));
}

export function isOperatorForCountry(
  method: string,
  code: string | null | undefined,
): method is MobileMoneyMethodId {
  return getOperatorsForCountry(code).some((m) => m.id === method);
}

export const LABEL_PLANS = {
  starter: {
    id: "starter" as const,
    name: "Starter Label",
    price: 2999,
    maxArtists: 5,
    description: "Jusqu'à 5 artistes · 1 an",
  },
  unlimited: {
    id: "unlimited" as const,
    name: "Unlimited Label",
    price: 14999,
    maxArtists: Infinity,
    description: "Artistes illimités · 1 an",
  },
} as const;

/** Abonnement artiste : publication illimitée pendant 1 an. */
export const ARTIST_PLAN = {
  id: "annual" as const,
  name: "Artiste Annuel",
  price: 990,
  description: "Publications illimitées · 1 an",
} as const;

export const COMMISSION_RATE = 0.2;

/** Prix minimum publication (aligné seuil Mobile Money MBIYO, ex. CG 500 XAF). */
export const MIN_RELEASE_PRICE_FCFA = 500;

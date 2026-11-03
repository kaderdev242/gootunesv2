import type { CountryCode } from "@/lib/constants";

/** Mapping pays Gootunes → devise MBIYOPAY */
export const MBIYO_CURRENCY_BY_COUNTRY: Record<CountryCode, string> = {
  CG: "XAF",
  CD: "CDF",
  CI: "XOF",
  CM: "XAF",
  SN: "XOF",
};

export const MBIYO_DIAL_BY_COUNTRY: Record<CountryCode, string> = {
  CG: "242",
  CD: "243",
  CI: "225",
  CM: "237",
  SN: "221",
};

/** Minimums documentés MBIYOPAY (unités majeures). */
export const MBIYO_MIN_AMOUNT_BY_COUNTRY: Partial<Record<CountryCode, number>> =
  {
    CG: 500,
    CI: 500,
    CM: 50,
    SN: 500,
    CD: 40,
  };

/** Réseau MBIYOPAY (metadata.network) */
export type MbiyoNetwork =
  | "mtn"
  | "orange"
  | "wave"
  | "airtel"
  | "vodacom"
  | "moov"
  | "africell"
  | "mpesa";

export function getMbiyoCurrency(country: string | null | undefined): string {
  if (country && country in MBIYO_CURRENCY_BY_COUNTRY) {
    return MBIYO_CURRENCY_BY_COUNTRY[country as CountryCode];
  }
  return "XAF";
}

/**
 * Normalise en chiffres + indicatif (sans +).
 * Congo-Brazzaville (CG) : le 0 national fait partie du numéro (+242 06…).
 * Autres pays : indicatif + numéro local sans 0 (comme sandbox / webhook).
 * @see https://dashboard.mbiyo.africa/docs/reference/merchant/payin
 */
export function normalizeMbiyoPhone(
  phone: string,
  country: string | null | undefined,
): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);

  const code = (country || "CG") as CountryCode;
  const dial =
    code in MBIYO_DIAL_BY_COUNTRY ? MBIYO_DIAL_BY_COUNTRY[code] : null;

  if (!dial) return digits;

  if (digits.startsWith(dial)) {
    return digits;
  }

  // CG : conserver / restaurer le 0 national (ex. 06… → 24206…)
  if (code === "CG") {
    if (!digits.startsWith("0")) digits = `0${digits}`;
    return `${dial}${digits}`;
  }

  if (digits.startsWith("0")) digits = digits.slice(1);
  return `${dial}${digits}`;
}

/** Format E.164 pour l’API payin (exemple doc : "+22670123456"). */
export function toMbiyoPhoneE164(digits: string): string {
  const clean = digits.replace(/\D/g, "");
  return clean ? `+${clean}` : "";
}

/** Contrôle basique avant appel API. */
export function isValidMbiyoPhone(
  phone: string,
  country: string | null | undefined,
): boolean {
  const code = (country || "CG") as CountryCode;
  const digits = phone.replace(/\D/g, "");
  switch (code) {
    case "CG":
      // MTN Congo uniquement (doc) — +242 06 XXX XX XX
      return /^24206\d{7}$/.test(digits);
    case "CD":
      return /^243\d{9}$/.test(digits);
    case "CM":
      return /^237\d{9}$/.test(digits);
    case "CI":
      return /^225\d{8,10}$/.test(digits);
    case "SN":
      return /^221\d{9}$/.test(digits);
    default:
      return digits.length >= 10 && digits.length <= 15;
  }
}

export function getMbiyoMinAmount(country: string | null | undefined): number {
  const code = (country || "CG") as CountryCode;
  return MBIYO_MIN_AMOUNT_BY_COUNTRY[code] ?? 50;
}

export function phonePlaceholder(country: string | null | undefined): string {
  switch (country) {
    case "CG":
      return "Ex. 06 123 4567";
    case "CD":
      return "Ex. 97 000 0000";
    case "CM":
      return "Ex. 67 00 00 00 0";
    case "CI":
      return "Ex. 07 00 00 00 00";
    case "SN":
      return "Ex. 77 000 00 00";
    default:
      return "Numéro Mobile Money";
  }
}

export function mbiyoConfigured() {
  return Boolean(process.env.MBIYO_API_KEY?.trim());
}

/**
 * Achats gratuits / sans MBIYO (tests locaux ou temporairement sur un env).
 * Mettre `PURCHASE_DEV_BYPASS=1` puis retirer pour réactiver les paiements réels.
 */
export function purchaseDevBypass() {
  return process.env.PURCHASE_DEV_BYPASS?.trim() === "1";
}

/**
 * Bloque les flux payants en production si la clé Mbiyo est absente.
 * Retourne un message d'erreur utilisateur, ou null si OK.
 */
export function mbiyoRequiredInProduction(): string | null {
  if (process.env.NODE_ENV === "production" && !mbiyoConfigured()) {
    return "Paiement temporairement indisponible. Réessaie plus tard.";
  }
  return null;
}

export function mbiyoBaseUrl() {
  return (
    process.env.MBIYO_API_BASE_URL?.replace(/\/$/, "") ||
    "https://dashboard.mbiyo.africa"
  );
}

export function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

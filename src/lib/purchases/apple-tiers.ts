/**
 * Paliers catalogue uniques (web / Android / iOS).
 * L’artiste choisit un palier FCFA ; Apple facture le price point du SKU.
 *
 * Mobile Money : artiste 80 % (`COMMISSION_RATE` 20 %).
 * iOS : Apple ~30 %, Gootunes 0 % extra → artiste 70 % du palier FCFA.
 * Retrait : tout le solde part en Mobile Money. Apple paie Gootunes.
 */
export const APPLE_BUNDLE_ID = "com.gootunes.app";

export const APPLE_IAP_ARTIST_RATE = 0.7;

export const DEFAULT_SINGLE_PRICE_FCFA = 500;
export const DEFAULT_ALBUM_PRICE_FCFA = 1500;

export const RELEASE_PRICE_TIERS = [
  { sku: "gootunes.unlock.t1", priceFcfa: 500, appleUsd: "0,99 $" },
  { sku: "gootunes.unlock.t2", priceFcfa: 1000, appleUsd: "1,99 $" },
  { sku: "gootunes.unlock.t3", priceFcfa: 1500, appleUsd: "2,99 $" },
  { sku: "gootunes.unlock.t4", priceFcfa: 2000, appleUsd: "3,99 $" },
  { sku: "gootunes.unlock.t5", priceFcfa: 3000, appleUsd: "4,99 $" },
  { sku: "gootunes.unlock.t6", priceFcfa: 5000, appleUsd: "7,99 $" },
  { sku: "gootunes.unlock.t7", priceFcfa: 8000, appleUsd: "12,99 $" },
  { sku: "gootunes.unlock.t8", priceFcfa: 10000, appleUsd: "14,99 $" },
] as const;

export type ReleasePriceTier = (typeof RELEASE_PRICE_TIERS)[number];

export function isReleasePriceTier(priceFcfa: number): boolean {
  return RELEASE_PRICE_TIERS.some((t) => t.priceFcfa === priceFcfa);
}

/** Anciens prix libres → palier le plus proche (égalité : palier inférieur). */
export function nearestReleasePriceTier(priceFcfa: number): ReleasePriceTier {
  const price = Number.isFinite(priceFcfa) ? Math.max(0, priceFcfa) : 0;
  let best: ReleasePriceTier = RELEASE_PRICE_TIERS[0];
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const t of RELEASE_PRICE_TIERS) {
    const d = Math.abs(t.priceFcfa - price);
    if (d < bestDiff || (d === bestDiff && t.priceFcfa < best.priceFcfa)) {
      best = t;
      bestDiff = d;
    }
  }
  return best;
}

export function appleSkuForPriceFcfa(priceFcfa: number): string {
  return nearestReleasePriceTier(priceFcfa).sku;
}

export function isKnownAppleSku(sku: string): boolean {
  return RELEASE_PRICE_TIERS.some((t) => t.sku === sku);
}

export function appleArtistNetFcfa(priceFcfa: number): number {
  return Math.round(priceFcfa * APPLE_IAP_ARTIST_RATE);
}

export function isApplePaymentMethod(method: string | null | undefined): boolean {
  return method === "apple";
}

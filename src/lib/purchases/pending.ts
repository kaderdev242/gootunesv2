/** Persistance locale d'un paiement en cours (polling fond). */

export const PENDING_PAYMENT_KEY = "gootunes:pending-payment";
/** @deprecated */
export const PENDING_PURCHASE_KEY = PENDING_PAYMENT_KEY;

export type PendingPaymentKind =
  | "purchase"
  | "label_plan"
  | "artist_plan"
  | "withdrawal";

export type PendingPayment = {
  kind: PendingPaymentKind;
  orderId: string;
  releaseId?: string;
  returnPath?: string;
  startedAt: number;
};

/** @deprecated alias */
export type PendingPurchase = PendingPayment;

export function readPendingPayment(): PendingPayment | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_PAYMENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingPayment;
    if (!parsed?.orderId) return null;
    if (Date.now() - (parsed.startedAt || 0) > 30 * 60 * 1000) {
      clearPendingPayment();
      return null;
    }
    // rétrocompat: anciens objets sans kind
    if (!parsed.kind) {
      parsed.kind = parsed.releaseId ? "purchase" : "label_plan";
    }
    return parsed;
  } catch {
    return null;
  }
}

export const readPendingPurchase = readPendingPayment;

export function writePendingPayment(data: PendingPayment) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(data));
}

export const writePendingPurchase = (
  data: Omit<PendingPayment, "kind"> & { kind?: PendingPaymentKind },
) =>
  writePendingPayment({
    kind: data.kind || "purchase",
    orderId: data.orderId,
    releaseId: data.releaseId,
    returnPath: data.returnPath,
    startedAt: data.startedAt,
  });

export function clearPendingPayment() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_PAYMENT_KEY);
}

export const clearPendingPurchase = clearPendingPayment;

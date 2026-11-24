/** Délai sans confirmation → statut « failed » (payins Mobile Money). */
export const PENDING_PAYIN_TTL_MS = 5 * 60_000;

export const TTL_EXPIRE_SOURCE = "ttl_expire" as const;

export function isTtlExpireMeta(meta: unknown): boolean {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return false;
  return (meta as { source?: string }).source === TTL_EXPIRE_SOURCE;
}

export function pendingPayinCutoffIso(now = Date.now()) {
  return new Date(now - PENDING_PAYIN_TTL_MS).toISOString();
}

/** True si created_at est plus vieux que le TTL pending. */
export function isPendingOlderThanTtl(createdAt: string, now = Date.now()) {
  const t = new Date(createdAt).getTime();
  if (!Number.isFinite(t)) return false;
  return now - t >= PENDING_PAYIN_TTL_MS;
}

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

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

function ttlMeta(extra?: Record<string, unknown>): Json {
  return {
    source: TTL_EXPIRE_SOURCE,
    expired_at: new Date().toISOString(),
    ...extra,
  } as Json;
}

/**
 * Passe en « failed » les payins Mbiyo encore pending après 5 minutes.
 * Exclut Apple IAP et les retraits.
 */
export async function expireStalePendingPayins(): Promise<{
  purchases: number;
  labelPlans: number;
  artistPlans: number;
}> {
  const admin = createAdminClient();
  const cutoff = pendingPayinCutoffIso();
  const meta = ttlMeta();

  const [purchases, labels, artists] = await Promise.all([
    admin
      .from("purchases")
      .update({ status: "failed", provider_meta: meta })
      .eq("status", "pending")
      .neq("provider", "apple")
      .lt("created_at", cutoff)
      .select("id"),
    admin
      .from("label_plan_orders")
      .update({ status: "failed", provider_meta: meta })
      .eq("status", "pending")
      .lt("created_at", cutoff)
      .select("id"),
    admin
      .from("artist_plan_orders")
      .update({ status: "failed", provider_meta: meta })
      .eq("status", "pending")
      .lt("created_at", cutoff)
      .select("id"),
  ]);

  return {
    purchases: purchases.data?.length || 0,
    labelPlans: labels.data?.length || 0,
    artistPlans: artists.data?.length || 0,
  };
}

/** True si created_at est plus vieux que le TTL pending. */
export function isPendingOlderThanTtl(createdAt: string, now = Date.now()) {
  const t = new Date(createdAt).getTime();
  if (!Number.isFinite(t)) return false;
  return now - t >= PENDING_PAYIN_TTL_MS;
}

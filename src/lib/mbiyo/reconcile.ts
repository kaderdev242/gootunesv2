import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { logServerError } from "@/lib/errors";
import { recordPaymentEvent } from "@/lib/payments/events";
import { getMbiyoTransaction, MbiyoApiError } from "./client";
import { failByOrderId, fulfillByOrderId } from "./fulfill";
import {
  PENDING_PAYIN_TTL_MS,
  TTL_EXPIRE_SOURCE,
} from "@/lib/purchases/expire-pending";

/**
 * Rapprochement des paiements Mobile Money avec Mbiyo.
 *
 * Avant : une commande « pending » depuis 5 min passait en échec sans rien
 * demander à Mbiyo. Si le client validait tard sur son téléphone et que le
 * webhook se perdait, il était débité mais rien ne se débloquait.
 *
 * Maintenant, pour chaque commande en attente (et chaque échec récent qui ne
 * vient pas d'un refus confirmé par Mbiyo), on demande le vrai statut :
 *  - successful → livraison (musique, abonnement, prod) ;
 *  - failed / cancelled → échec confirmé ;
 *  - pending / introuvable → échec « expiré », revérifié plus tard (72 h).
 */

type Table = "purchases" | "label_plan_orders" | "artist_plan_orders" | "beat_orders";
const TABLES: Table[] = ["purchases", "label_plan_orders", "artist_plan_orders", "beat_orders"];

/** Fenêtre de revérification des échecs non confirmés par Mbiyo. */
const RECHECK_WINDOW_MS = 72 * 60 * 60_000;
/** Délai minimal entre deux revérifications d'une même commande. */
const RECHECK_EVERY_MS = 20 * 60_000;
/** Écart toléré : Mbiyo arrondit au multiple de 5 dans plusieurs pays. */
const AMOUNT_TOLERANCE = 5;

const SUCCESS = new Set(["successful", "success", "completed"]);
const FAILURE = new Set(["failed", "cancelled"]);

type Row = {
  order_id: string | null;
  status: string;
  provider: string | null;
  provider_transaction_id: string | null;
  provider_meta: Json | null;
  created_at: string;
};

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/** Échec qui ne vient pas d'un refus confirmé par Mbiyo : à revérifier. */
export function isUnconfirmedFailure(meta: unknown) {
  const m = asObject(meta);
  if (m.verified_status === "failed" || m.verified_status === "cancelled") return false;
  return m.source === TTL_EXPIRE_SOURCE || m.source === undefined || m.source === "reconcile";
}

function recentlyChecked(meta: unknown, now: number) {
  const at = asObject(meta).reconciled_at;
  return typeof at === "string" && now - new Date(at).getTime() < RECHECK_EVERY_MS;
}

async function patchMeta(table: Table, orderId: string, status: string, extra: Record<string, unknown>, newStatus?: string) {
  const admin = createAdminClient();
  const { data } = await admin.from(table).select("provider_meta").eq("order_id", orderId).maybeSingle();
  await admin
    .from(table)
    .update({
      ...(newStatus ? { status: newStatus } : {}),
      provider_meta: { ...asObject(data?.provider_meta), ...extra } as Json,
    } as never)
    .eq("order_id", orderId)
    .eq("status", status as never);
}

export type ReconcileResult = {
  checked: number;
  fulfilled: number;
  failed: number;
  expired: number;
  held: number;
  errors: number;
};

/** Vérifie une commande auprès de Mbiyo et applique le résultat. */
async function reconcileRow(table: Table, row: Row, now: number, result: ReconcileResult) {
  const orderId = row.order_id;
  if (!orderId) return;
  const lookup = row.provider_transaction_id || orderId;
  const age = now - new Date(row.created_at).getTime();
  const stamp = { reconciled_at: new Date(now).toISOString() };
  result.checked += 1;

  let tx: { status: string; amount: number; currency: string; transaction_id: string } | null = null;
  try {
    const res = await getMbiyoTransaction(lookup);
    tx = {
      status: String(res.data.status).toLowerCase(),
      amount: Number(res.data.amount),
      currency: String(res.data.currency ?? ""),
      transaction_id: String(res.data.transaction_id ?? lookup),
    };
  } catch (e) {
    if (!(e instanceof MbiyoApiError && e.httpStatus === 404)) {
      // Mbiyo injoignable : on réessaiera au prochain passage.
      result.errors += 1;
      return;
    }
  }

  // Introuvable ou encore en attente chez Mbiyo.
  if (!tx || (!SUCCESS.has(tx.status) && !FAILURE.has(tx.status))) {
    if (row.status === "pending" && age >= PENDING_PAYIN_TTL_MS) {
      await patchMeta(table, orderId, "pending", {
        source: TTL_EXPIRE_SOURCE,
        expired_at: new Date(now).toISOString(),
        mbiyo_status: tx?.status ?? "not_found",
        ...stamp,
      }, "failed");
      result.expired += 1;
    } else {
      await patchMeta(table, orderId, row.status, stamp);
    }
    return;
  }

  if (SUCCESS.has(tx.status)) {
    const meta = asObject(row.provider_meta);
    const expected = typeof meta.amount_charged === "number" ? meta.amount_charged : null;
    const expectedCurrency = typeof meta.currency === "string" ? meta.currency : null;
    const amountOk = expected === null || Math.abs(tx.amount - expected) <= AMOUNT_TOLERANCE;
    const currencyOk =
      !expectedCurrency || !tx.currency || tx.currency.toUpperCase() === expectedCurrency.toUpperCase();
    if (!amountOk || !currencyOk) {
      await patchMeta(table, orderId, row.status, { ...stamp, held: "amount_mismatch" });
      await recordPaymentEvent({
        orderId,
        transactionId: tx.transaction_id,
        source: "reconcile",
        mbiyoStatus: tx.status,
        outcome: "held",
        detail: `Montant payé ${tx.amount} ${tx.currency}, attendu ${expected ?? "?"} ${expectedCurrency ?? ""} : à vérifier`,
      });
      result.held += 1;
      return;
    }
    const done = await fulfillByOrderId(orderId, tx.transaction_id, {
      source: "reconcile",
      verified_status: tx.status,
      ...stamp,
    } as Json);
    await recordPaymentEvent({
      orderId,
      transactionId: tx.transaction_id,
      source: "reconcile",
      mbiyoStatus: tx.status,
      outcome: done.ok ? "fulfilled" : `not_fulfilled:${"reason" in done ? done.reason : "?"}`,
      detail: row.status === "failed" ? "Paiement confirmé par Mbiyo après un échec chez nous" : "",
    });
    if (done.ok) result.fulfilled += 1;
    return;
  }

  // failed / cancelled confirmé par Mbiyo
  if (row.status === "pending") {
    await failByOrderId(orderId, tx.transaction_id, {
      source: "reconcile",
      verified_status: tx.status,
      ...stamp,
    } as Json);
    await recordPaymentEvent({
      orderId,
      transactionId: tx.transaction_id,
      source: "reconcile",
      mbiyoStatus: tx.status,
      outcome: "failed",
    });
    result.failed += 1;
  } else {
    await patchMeta(table, orderId, row.status, { ...stamp, verified_status: tx.status });
  }
}

/**
 * Passe en revue les commandes Mobile Money à vérifier (les plus récentes
 * d'abord), au plus `maxChecks` appels à Mbiyo par passage.
 */
export async function reconcileMbiyoPayins(maxChecks = 20): Promise<ReconcileResult> {
  const result: ReconcileResult = { checked: 0, fulfilled: 0, failed: 0, expired: 0, held: 0, errors: 0 };
  const now = Date.now();
  const pendingCutoff = new Date(now - PENDING_PAYIN_TTL_MS).toISOString();
  const recheckSince = new Date(now - RECHECK_WINDOW_MS).toISOString();
  const admin = createAdminClient();
  const columns = "order_id, status, provider, provider_transaction_id, provider_meta, created_at";

  const queue: { table: Table; row: Row }[] = [];
  for (const table of TABLES) {
    const [pending, failed] = await Promise.all([
      admin.from(table).select(columns).eq("status", "pending").lt("created_at", pendingCutoff)
        .order("created_at", { ascending: false }).limit(maxChecks),
      admin.from(table).select(columns).eq("status", "failed").gte("created_at", recheckSince)
        .order("created_at", { ascending: false }).limit(maxChecks * 2),
    ]);
    for (const row of (pending.data ?? []) as Row[]) {
      if (row.provider === "apple") continue;
      if (!recentlyChecked(row.provider_meta, now)) queue.push({ table, row });
    }
    for (const row of (failed.data ?? []) as Row[]) {
      if (row.provider === "apple") continue;
      if (isUnconfirmedFailure(row.provider_meta) && !recentlyChecked(row.provider_meta, now)) {
        queue.push({ table, row });
      }
    }
  }

  queue.sort((a, b) => new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime());
  for (const { table, row } of queue.slice(0, maxChecks)) {
    try {
      await reconcileRow(table, row, now, result);
    } catch (e) {
      result.errors += 1;
      logServerError("mbiyo.reconcile.row", e, { order: row.order_id });
    }
  }
  return result;
}

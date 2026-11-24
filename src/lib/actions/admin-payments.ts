"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { getMbiyoTransaction, MbiyoApiError, resendMbiyoWebhook } from "@/lib/mbiyo/client";
import { fulfillByOrderId } from "@/lib/mbiyo/fulfill";
import { listPaymentEvents, recordPaymentEvent, type PaymentEvent } from "@/lib/payments/events";
import { BEAT_ORDER_PREFIX } from "@/lib/prods/constants";

/** Table de la commande d'après le préfixe de son numéro. */
function tableFor(orderId: string) {
  if (orderId.startsWith(BEAT_ORDER_PREFIX)) return "beat_orders" as const;
  if (orderId.startsWith("LAB-")) return "label_plan_orders" as const;
  if (orderId.startsWith("ART-")) return "artist_plan_orders" as const;
  if (orderId.startsWith("WD-")) return "withdrawals" as const;
  return "purchases" as const;
}

const ORDER_RE = /^[A-Za-z0-9_-]{4,80}$/;
const SUCCESS = new Set(["successful", "success", "completed"]);

export type PaymentCheck = {
  error?: string;
  order?: {
    orderId: string;
    status: string;
    amountFcfa: number;
    transactionId: string | null;
    createdAt: string;
    expectedAmount: number | null;
    expectedCurrency: string | null;
  };
  mbiyo?: {
    found: boolean;
    status?: string;
    amount?: number;
    currency?: string;
    transactionId?: string;
    phone?: string | null;
    network?: string | null;
    updatedAt?: string | null;
  };
  mbiyoError?: string;
  /** Montant et devise payés = attendus (tolérance d'arrondi de 5). */
  amountMatches?: boolean;
  events?: PaymentEvent[];
};

async function loadOrder(orderId: string) {
  const table = tableFor(orderId);
  const db = createAdminClient();
  // Les retraits n'ont ni provider_meta de collecte ni amount_charged.
  const { data } = await db
    .from(table)
    .select("order_id, status, amount_fcfa, provider_transaction_id, provider_meta, created_at")
    .eq("order_id", orderId)
    .maybeSingle();
  return data as
    | {
        order_id: string;
        status: string;
        amount_fcfa: number;
        provider_transaction_id: string | null;
        provider_meta: Json | null;
        created_at: string;
      }
    | null;
}

/** Vérification : notre commande face à la transaction côté Mbiyo, plus l'historique. */
export async function adminCheckPayment(orderId: string): Promise<PaymentCheck> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };
  if (!ORDER_RE.test(orderId)) return { error: "Commande invalide." };

  const order = await loadOrder(orderId);
  if (!order) return { error: "Commande introuvable." };
  const meta = (order.provider_meta ?? {}) as Record<string, unknown>;
  const expectedAmount = typeof meta.amount_charged === "number" ? meta.amount_charged : null;
  const expectedCurrency = typeof meta.currency === "string" ? meta.currency : null;

  const result: PaymentCheck = {
    order: {
      orderId,
      status: order.status,
      amountFcfa: Number(order.amount_fcfa) || 0,
      transactionId: order.provider_transaction_id,
      createdAt: order.created_at,
      expectedAmount,
      expectedCurrency,
    },
  };

  try {
    const res = await getMbiyoTransaction(order.provider_transaction_id || orderId);
    const d = res.data as typeof res.data & { metadata?: { phone_number?: string; network?: string }; updated_at?: string };
    const amount = Number(d.amount);
    const currency = String(d.currency ?? "");
    result.mbiyo = {
      found: true,
      status: String(d.status).toLowerCase(),
      amount,
      currency,
      transactionId: d.transaction_id,
      phone: d.metadata?.phone_number ?? null,
      network: d.metadata?.network ?? null,
      updatedAt: d.updated_at ?? null,
    };
    result.amountMatches =
      (expectedAmount === null || Math.abs(amount - expectedAmount) <= 5) &&
      (!expectedCurrency || !currency || currency.toUpperCase() === expectedCurrency.toUpperCase());
  } catch (e) {
    if (e instanceof MbiyoApiError && e.httpStatus === 404) result.mbiyo = { found: false };
    else result.mbiyoError = e instanceof Error ? e.message : "Mbiyo injoignable";
  }

  await recordPaymentEvent({
    orderId,
    transactionId: result.mbiyo?.transactionId ?? order.provider_transaction_id,
    source: "admin",
    mbiyoStatus: result.mbiyo?.status ?? null,
    outcome: "checked",
    actorId: admin.userId,
  });
  result.events = await listPaymentEvents(orderId);
  return result;
}

/**
 * Validation manuelle d'un paiement.
 * - Si Mbiyo confirme « successful » avec le bon montant : validation directe.
 * - Sinon (Mbiyo injoignable, statut différent, montant différent) : il faut
 *   forcer, avec une note de vérification d'au moins 10 caractères.
 * Une fois validée, la commande se débloque comme un paiement normal
 * (bibliothèque, solde de l'artiste, abonnement, prod, e-mails, push).
 */
export async function adminValidatePayment(input: {
  orderId: string;
  note: string;
  force?: boolean;
}): Promise<{ error?: string; success?: string }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };
  const orderId = String(input.orderId ?? "");
  if (!ORDER_RE.test(orderId)) return { error: "Commande invalide." };
  const note = String(input.note ?? "").trim().slice(0, 500);

  const order = await loadOrder(orderId);
  if (!order) return { error: "Commande introuvable." };
  if (order.status === "completed") return { success: "Déjà validée." };
  if (order.status !== "pending" && order.status !== "failed") {
    return { error: `Statut « ${order.status} » : validation impossible.` };
  }
  if (tableFor(orderId) === "withdrawals" && input.force) {
    return { error: "Un retrait ne se force pas : vérifie l'envoi chez Mbiyo." };
  }

  const check = await adminCheckPayment(orderId);
  const confirmed = Boolean(check.mbiyo?.found && check.mbiyo.status && SUCCESS.has(check.mbiyo.status) && check.amountMatches);

  if (!confirmed) {
    if (!input.force) {
      return { error: "Mbiyo ne confirme pas ce paiement (ou le montant diffère). Utilise la validation forcée après vérification." };
    }
    if (note.length < 10) {
      return { error: "Explique ta vérification (10 caractères minimum)." };
    }
  }

  const done = await fulfillByOrderId(orderId, check.mbiyo?.transactionId ?? order.provider_transaction_id, {
    source: "admin",
    validated_by: admin.userId,
    validated_at: new Date().toISOString(),
    forced: !confirmed,
    note,
    verified_status: check.mbiyo?.status ?? null,
  } as Json);

  await recordPaymentEvent({
    orderId,
    transactionId: check.mbiyo?.transactionId ?? order.provider_transaction_id,
    source: "admin",
    mbiyoStatus: check.mbiyo?.status ?? null,
    outcome: done.ok ? (confirmed ? "validated" : "force_validated") : `validation_failed:${"reason" in done ? done.reason : "?"}`,
    detail: note,
    actorId: admin.userId,
  });

  if (!done.ok) return { error: "Validation impossible (la commande a peut-être changé). Recharge la page." };

  revalidatePath("/goo-admin/transactions");
  revalidatePath("/goo-admin/abonnements");
  return { success: confirmed ? "Paiement validé : tout est débloqué." : "Validation forcée enregistrée : tout est débloqué." };
}

/** Redemande à Mbiyo d'envoyer le webhook (diagnostic de la réception). */
export async function adminResendWebhook(orderId: string): Promise<{ error?: string; success?: string }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };
  if (!ORDER_RE.test(orderId)) return { error: "Commande invalide." };
  const order = await loadOrder(orderId);
  if (!order?.provider_transaction_id) return { error: "Pas d'identifiant de transaction Mbiyo pour cette commande." };

  try {
    const res = await resendMbiyoWebhook(order.provider_transaction_id);
    const delivered = Boolean(res.data?.delivered);
    await recordPaymentEvent({
      orderId,
      transactionId: order.provider_transaction_id,
      source: "admin",
      outcome: delivered ? "webhook_resent" : "webhook_resent_not_acknowledged",
      detail: `Réponse de notre serveur : HTTP ${res.data?.status_code ?? "?"} · ${res.data?.webhook_url ?? ""}`,
      actorId: admin.userId,
    });
    revalidatePath("/goo-admin/transactions");
    return delivered
      ? { success: `Webhook renvoyé et accepté (HTTP ${res.data?.status_code ?? 200}).` }
      : { error: `Webhook renvoyé mais refusé par notre serveur (HTTP ${res.data?.status_code ?? "?"}).` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Renvoi impossible." };
  }
}

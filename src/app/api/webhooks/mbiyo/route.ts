import { NextRequest, NextResponse } from "next/server";
import {
  getMbiyoTransaction,
  MbiyoApiError,
  verifyMbiyoWebhookSignature,
} from "@/lib/mbiyo/client";
import { recordPaymentEvent } from "@/lib/payments/events";
import {
  failByOrderId,
  fulfillByOrderId,
  getExpectedPayment,
} from "@/lib/mbiyo/fulfill";
import { logServerError } from "@/lib/errors";
import type { Json } from "@/lib/supabase/database.types";
import { mbiyoWebhookSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUCCESS = new Set(["successful", "success", "completed"]);
const FAILURE = new Set(["failed", "cancelled"]);

/** Écart toléré : Mbiyo arrondit au multiple de 5 (BF, BJ, CI, CM, GN, ML, TG). */
const AMOUNT_TOLERANCE = 5;

/**
 * Webhook MBIYOPAY — cashin (achat / abonnement) + cashout (retrait).
 *
 * Sécurité, dans l'ordre :
 *  1. Signature HMAC-SHA256 (header « Signature »).
 *  2. Contre-vérification de la transaction via l'API Mbiyo (recommandé par
 *     la doc) : on ne fait jamais confiance au seul contenu du webhook.
 *  3. Cohérence commande / montant / devise avec ce qu'on a enregistré.
 *
 * @see https://dashboard.mbiyo.africa/docs/reference/merchant/payin
 * @see https://dashboard.mbiyo.africa/docs/reference/merchant/payout
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("signature") || request.headers.get("x-mbiyo-signature");

  if (!verifyMbiyoWebhookSignature(rawBody, signature)) {
    // Trace (sans faire confiance au contenu) : un secret mal configuré
    // bloquerait tous les paiements, il faut le voir tout de suite.
    let claimedOrder: string | null = null;
    try {
      claimedOrder = String((JSON.parse(rawBody) as { order_id?: unknown }).order_id ?? "") || null;
    } catch {
      /* corps illisible */
    }
    await recordPaymentEvent({
      orderId: claimedOrder,
      source: "webhook",
      outcome: "bad_signature",
      detail: signature ? "Signature HMAC différente (secret MBIYO_WEBHOOK_SECRET ?)" : "En-tête Signature absent",
    });
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = mbiyoWebhookSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload incomplet" }, { status: 400 });
  }
  const payload = parsed.data;
  const claimed = String(payload.status).toLowerCase();

  // Statut intermédiaire : rien à faire.
  if (!SUCCESS.has(claimed) && !FAILURE.has(claimed)) {
    return NextResponse.json({ received: true });
  }

  const expected = await getExpectedPayment(payload.order_id);
  if (!expected.found) {
    // Commande inconnue : on accuse réception pour stopper les relances.
    logServerError("mbiyo.webhook.unknown_order", new Error(payload.order_id));
    await recordPaymentEvent({
      orderId: payload.order_id,
      transactionId: payload.transaction_id,
      source: "webhook",
      mbiyoStatus: claimed,
      outcome: "unknown_order",
    });
    return NextResponse.json({ received: true });
  }

  // ── Contre-vérification auprès de Mbiyo ──
  let verified: {
    status: string;
    order_id: string;
    amount: number;
    currency: string;
    transaction_id: string;
  };
  try {
    // Par identifiant de transaction, sinon par numéro de commande.
    const res = await getMbiyoTransaction(payload.transaction_id).catch((e: unknown) => {
      if (e instanceof MbiyoApiError && e.httpStatus === 404) {
        return getMbiyoTransaction(payload.order_id);
      }
      throw e;
    });
    verified = {
      status: String(res.data.status).toLowerCase(),
      order_id: String(res.data.order_id ?? ""),
      amount: Number(res.data.amount),
      currency: String(res.data.currency ?? ""),
      transaction_id: String(res.data.transaction_id ?? payload.transaction_id),
    };
  } catch (e) {
    // API indisponible : 503 pour que Mbiyo renvoie le webhook plus tard.
    // (Le suivi de paiement côté client revérifie aussi le statut.)
    logServerError("mbiyo.webhook.verify_unavailable", e, { order: payload.order_id });
    await recordPaymentEvent({
      orderId: payload.order_id,
      transactionId: payload.transaction_id,
      source: "webhook",
      mbiyoStatus: claimed,
      outcome: "verify_unavailable",
      detail: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Vérification indisponible" }, { status: 503 });
  }

  if (verified.order_id && verified.order_id !== payload.order_id) {
    logServerError("mbiyo.webhook.order_mismatch", new Error("order_id différent"), {
      webhook: payload.order_id,
      api: verified.order_id,
    });
    await recordPaymentEvent({
      orderId: payload.order_id,
      transactionId: payload.transaction_id,
      source: "webhook",
      mbiyoStatus: verified.status,
      outcome: "order_mismatch",
      detail: `Mbiyo rattache cette transaction à ${verified.order_id}`,
    });
    return NextResponse.json({ error: "Commande incohérente" }, { status: 400 });
  }

  const meta = {
    source: "webhook",
    type: payload.type ?? null,
    webhook_status: payload.status,
    verified_status: verified.status,
    amount: verified.amount,
    fee: payload.fee ?? null,
    charged_amount: payload.charged_amount ?? null,
    metadata: (payload.metadata ?? {}) as Json,
  } as Json;

  try {
    if (SUCCESS.has(verified.status)) {
      const amountOk =
        expected.amount === null ||
        Math.abs(verified.amount - expected.amount) <= AMOUNT_TOLERANCE;
      const currencyOk =
        !expected.currency ||
        !verified.currency ||
        verified.currency.toUpperCase() === expected.currency.toUpperCase();

      if (!amountOk || !currencyOk) {
        // Montant payé différent du prix : on ne livre pas, à vérifier à la main.
        logServerError("mbiyo.webhook.amount_mismatch", new Error("Montant ou devise incohérent"), {
          order: payload.order_id,
          expected,
          verified: { amount: verified.amount, currency: verified.currency },
        });
        await recordPaymentEvent({
          orderId: payload.order_id,
          transactionId: verified.transaction_id,
          source: "webhook",
          mbiyoStatus: verified.status,
          outcome: "held",
          detail: `Montant payé ${verified.amount} ${verified.currency}, attendu ${expected.amount ?? "?"} ${expected.currency ?? ""} : à vérifier dans l'admin`,
        });
        return NextResponse.json({ received: true, held: true });
      }

      const done = await fulfillByOrderId(payload.order_id, verified.transaction_id, meta);
      await recordPaymentEvent({
        orderId: payload.order_id,
        transactionId: verified.transaction_id,
        source: "webhook",
        mbiyoStatus: verified.status,
        outcome: done.ok ? ("already" in done && done.already ? "already_done" : "fulfilled") : `not_fulfilled:${"reason" in done ? done.reason : "?"}`,
      });
    } else if (FAILURE.has(verified.status)) {
      await failByOrderId(payload.order_id, verified.transaction_id, meta);
      await recordPaymentEvent({
        orderId: payload.order_id,
        transactionId: verified.transaction_id,
        source: "webhook",
        mbiyoStatus: verified.status,
        outcome: "failed",
      });
    } else {
      // Encore « pending » côté API : le rapprochement repassera.
      await recordPaymentEvent({
        orderId: payload.order_id,
        transactionId: verified.transaction_id,
        source: "webhook",
        mbiyoStatus: verified.status,
        outcome: "still_pending",
        detail: `Webhook « ${claimed} » mais API « ${verified.status} »`,
      });
    }
  } catch (e) {
    logServerError("mbiyo.webhook.process", e, { order: payload.order_id });
    await recordPaymentEvent({
      orderId: payload.order_id,
      transactionId: payload.transaction_id,
      source: "webhook",
      mbiyoStatus: verified.status,
      outcome: "error",
      detail: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Traitement impossible" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

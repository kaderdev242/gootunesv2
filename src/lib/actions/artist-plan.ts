"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  ARTIST_PLAN,
  isOperatorForCountry,
  type CountryCode,
} from "@/lib/constants";
import { createMbiyoPayin, getMbiyoTransaction } from "@/lib/mbiyo/client";
import {
  getMbiyoCurrency,
  isValidMbiyoPhone,
  mbiyoConfigured,
  mbiyoRequiredInProduction,
  normalizeMbiyoPhone,
  siteUrl,
  toMbiyoPhoneE164,
} from "@/lib/mbiyo/config";
import {
  failArtistPlanByOrderId,
  fulfillArtistPlanByOrderId,
} from "@/lib/mbiyo/fulfill";
import {
  isPendingOlderThanTtl,
  TTL_EXPIRE_SOURCE,
} from "@/lib/purchases/expire-pending";
import {
  logServerError,
  mapDbError,
  mapPaymentError,
} from "@/lib/errors";
import { toMbiyoPayAmount } from "@/lib/currency";
import type { PaymentMethod } from "@/lib/supabase/database.types";
import type { ActionState } from "./profile";

/** Payin Mobile Money pour activer / renouveler l'abonnement artiste annuel. */
export async function initiateArtistPlan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const payment_method = String(
    formData.get("payment_method") || "",
  ) as PaymentMethod;
  const phoneRaw = String(formData.get("phone") || "").trim();

  if (!payment_method || !phoneRaw) {
    return { error: "Opérateur et numéro Mobile Money requis." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, country, phone, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "artist") {
    return { error: "Réservé aux comptes artiste." };
  }

  const country = (profile.country || "CG") as CountryCode;
  if (!isOperatorForCountry(payment_method, country)) {
    return { error: "Cet opérateur n'est pas disponible dans ton pays." };
  }

  const amount = ARTIST_PLAN.price;
  const payAmount = toMbiyoPayAmount(amount, country);
  const phone = normalizeMbiyoPhone(phoneRaw, country);
  if (!isValidMbiyoPhone(phone, country)) {
    return { error: "Numéro Mobile Money invalide pour ton pays." };
  }

  const currency = getMbiyoCurrency(country);
  const orderId = `ART-ANN-${randomUUID().slice(0, 8)}`;

  const mbiyoGate = mbiyoRequiredInProduction();
  if (mbiyoGate) {
    logServerError(
      "artist.plan.mbiyo_missing_production",
      new Error("MBIYO_API_KEY absente en production"),
    );
    return { error: mbiyoGate };
  }

  if (!mbiyoConfigured()) {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    const { error } = await supabase
      .from("profiles")
      .update({
        artist_plan: "annual",
        artist_plan_expires_at: expires.toISOString(),
      })
      .eq("id", user.id);
    if (error) {
      logServerError("artist.plan.demo", error);
      return { error: mapDbError(error, "Impossible d'activer l'abonnement.") };
    }
    revalidatePath("/artist");
    revalidatePath("/artist/abonnement");
    revalidatePath("/artist/publier");
    return {
      success: `Abonnement ${ARTIST_PLAN.name} activé (démo) jusqu'au ${expires.toLocaleDateString("fr-FR")}.`,
    };
  }

  const { data: order, error: insertError } = await supabase
    .from("artist_plan_orders")
    .insert({
      user_id: user.id,
      plan: "annual",
      amount_fcfa: amount,
      payment_method,
      order_id: orderId,
      status: "pending",
      provider: "mbiyo",
      payer_phone: phone,
      provider_meta: { currency, country_code: country, network: payment_method },
    })
    .select("id")
    .single();

  if (insertError || !order) {
    logServerError("artist.plan.insert", insertError);
    return {
      error: mapDbError(insertError, "Impossible de créer la commande."),
    };
  }

  try {
    const res = await createMbiyoPayin({
      amount: payAmount,
      currency,
      payment_method: "mobile_money",
      order_id: orderId,
      callback_url: `${siteUrl()}/api/webhooks/mbiyo`,
      metadata: {
        network: payment_method,
        phone_number: toMbiyoPhoneE164(phone),
        country_code: country,
      },
    });

    const tx = res.data;
    await supabase
      .from("artist_plan_orders")
      .update({
        provider_transaction_id: tx.transaction_id,
        provider_meta: {
          currency,
          country_code: country,
          network: payment_method,
          amount_fcfa: amount,
          amount_charged: payAmount,
          fee: tx.fee,
          charged_amount: tx.charged_amount,
          mbiyo_status: tx.status,
        },
      })
      .eq("id", order.id);

    if (tx.status === "successful") {
      await fulfillArtistPlanByOrderId(orderId, tx.transaction_id, {
        source: "payin_immediate",
      });
      return {
        success: `Abonnement ${ARTIST_PLAN.name} activé.`,
        actionHref: "/artist/publier?type=single",
        actionLabel: "Publier un single",
      };
    }

    if (tx.status === "failed" || tx.status === "cancelled") {
      await failArtistPlanByOrderId(orderId, tx.transaction_id);
      return { error: "Le paiement a échoué. Réessaie." };
    }

    return {
      paymentPending: true,
      orderId,
      purchaseId: order.id,
      providerTransactionId: tx.transaction_id,
      instructionsHtml: tx.instructions ?? null,
      authMode: tx.auth_mode ?? null,
      redirectUrl: tx.redirect_url ?? null,
      success: "Paiement initié — valide sur ton téléphone Mobile Money.",
    };
  } catch (e) {
    await failArtistPlanByOrderId(orderId);
    logServerError("artist.plan.payin", e);
    return { error: mapPaymentError(e, "payin") };
  }
}

export async function checkArtistPlanStatus(orderId: string): Promise<{
  status: "pending" | "completed" | "failed" | "cancelled" | "unknown";
  message?: string;
}> {
  if (!orderId?.startsWith("ART-")) return { status: "unknown" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "unknown", message: "Non authentifié" };

  const { data: order } = await supabase
    .from("artist_plan_orders")
    .select("id, status, provider_transaction_id, order_id, created_at")
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) return { status: "unknown", message: "Commande introuvable" };
  if (order.status === "completed") return { status: "completed" };
  if (order.status === "failed" || order.status === "cancelled") {
    return { status: order.status };
  }

  if (!mbiyoConfigured()) return { status: "pending" };

  try {
    const lookup = order.provider_transaction_id || order.order_id || orderId;
    const res = await getMbiyoTransaction(lookup);
    const st = res.data.status;
    if (st === "successful") {
      await fulfillArtistPlanByOrderId(orderId, res.data.transaction_id, {
        source: "poll",
      });
      return { status: "completed" };
    }
    if (st === "failed" || st === "cancelled") {
      await failArtistPlanByOrderId(orderId, res.data.transaction_id);
      return { status: st === "cancelled" ? "cancelled" : "failed" };
    }
  } catch {
    /* pending */
  }

  if (isPendingOlderThanTtl(order.created_at)) {
    await failArtistPlanByOrderId(orderId, order.provider_transaction_id, {
      source: TTL_EXPIRE_SOURCE,
      expired_at: new Date().toISOString(),
      via: "poll",
    });
    return { status: "failed" };
  }

  return { status: "pending" };
}

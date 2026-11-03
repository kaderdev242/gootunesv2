"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  isOperatorForCountry,
  LABEL_PLANS,
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
  failLabelPlanByOrderId,
  fulfillLabelPlanByOrderId,
} from "@/lib/mbiyo/fulfill";
import {
  isPendingOlderThanTtl,
  TTL_EXPIRE_SOURCE,
} from "@/lib/purchases/expire-pending";
import { notifyLabelArtistCreated } from "@/lib/email/notify";
import {
  logServerError,
  mapDbError,
  mapPaymentError,
} from "@/lib/errors";
import { toMbiyoPayAmount } from "@/lib/currency";
import type { PaymentMethod } from "@/lib/supabase/database.types";
import type { ActionState } from "./profile";

/** Payin Mobile Money pour activer / renouveler un abonnement label. */
export async function initiateLabelPlan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const plan = String(formData.get("plan") || "");
  const payment_method = String(
    formData.get("payment_method") || "",
  ) as PaymentMethod;
  const phoneRaw = String(formData.get("phone") || "").trim();

  if (plan !== "starter" && plan !== "unlimited") {
    return { error: "Plan invalide." };
  }
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

  if (profile?.role !== "label") {
    return { error: "Réservé aux comptes label." };
  }

  const country = (profile.country || "CG") as CountryCode;
  if (!isOperatorForCountry(payment_method, country)) {
    return { error: "Cet opérateur n'est pas disponible dans ton pays." };
  }

  const amount = LABEL_PLANS[plan].price;
  const payAmount = toMbiyoPayAmount(amount, country);
  const phone = normalizeMbiyoPhone(phoneRaw, country);
  if (!isValidMbiyoPhone(phone, country)) {
    return { error: "Numéro Mobile Money invalide pour ton pays." };
  }

  const currency = getMbiyoCurrency(country);
  const orderId = `LAB-${plan.slice(0, 3).toUpperCase()}-${randomUUID().slice(0, 8)}`;

  const mbiyoGate = mbiyoRequiredInProduction();
  if (mbiyoGate) {
    logServerError(
      "label.plan.mbiyo_missing_production",
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
        label_plan: plan,
        label_plan_expires_at: expires.toISOString(),
      })
      .eq("id", user.id);
    if (error) {
      logServerError("label.plan.demo", error);
      return { error: mapDbError(error, "Impossible d'activer l'abonnement.") };
    }
    revalidatePath("/label");
    revalidatePath("/label/abonnement");
    return {
      success: `Abonnement ${LABEL_PLANS[plan].name} activé (démo) jusqu'au ${expires.toLocaleDateString("fr-FR")}.`,
    };
  }

  const { data: order, error: insertError } = await supabase
    .from("label_plan_orders")
    .insert({
      user_id: user.id,
      plan,
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
    logServerError("label.plan.insert", insertError);
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
      .from("label_plan_orders")
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
      await fulfillLabelPlanByOrderId(orderId, tx.transaction_id, {
        source: "payin_immediate",
      });
      return {
        success: `Abonnement ${LABEL_PLANS[plan].name} activé.`,
        actionHref: "/label/artistes",
        actionLabel: "Ajouter un artiste",
      };
    }

    if (tx.status === "failed" || tx.status === "cancelled") {
      await failLabelPlanByOrderId(orderId, tx.transaction_id);
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
    await failLabelPlanByOrderId(orderId);
    logServerError("label.plan.payin", e);
    return { error: mapPaymentError(e, "payin") };
  }
}

/** @deprecated alias */
export const activateLabelPlan = initiateLabelPlan;

export async function checkLabelPlanStatus(orderId: string): Promise<{
  status: "pending" | "completed" | "failed" | "cancelled" | "unknown";
  message?: string;
}> {
  if (!orderId?.startsWith("LAB-")) return { status: "unknown" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "unknown", message: "Non authentifié" };

  const { data: order } = await supabase
    .from("label_plan_orders")
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
    const lookup =
      order.provider_transaction_id || order.order_id || orderId;
    const res = await getMbiyoTransaction(lookup);
    const st = res.data.status;
    if (st === "successful") {
      await fulfillLabelPlanByOrderId(orderId, res.data.transaction_id, {
        source: "poll",
      });
      return { status: "completed" };
    }
    if (st === "failed" || st === "cancelled") {
      await failLabelPlanByOrderId(orderId, res.data.transaction_id);
      return { status: st === "cancelled" ? "cancelled" : "failed" };
    }
  } catch {
    /* pending */
  }

  if (isPendingOlderThanTtl(order.created_at)) {
    await failLabelPlanByOrderId(orderId, order.provider_transaction_id, {
      source: TTL_EXPIRE_SOURCE,
      expired_at: new Date().toISOString(),
      via: "poll",
    });
    return { status: "failed" };
  }

  return { status: "pending" };
}

export async function createLabelArtist(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const stage_name = String(formData.get("stage_name") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const avatar_url = String(formData.get("avatar_url") || "").trim();

  if (!avatar_url) return { error: "Photo de profil obligatoire." };
  if (!stage_name) return { error: "Nom de scène requis." };
  if (!country) return { error: "Pays obligatoire." };
  if (!bio) return { error: "Bio obligatoire." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, label_plan, email, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "label") return { error: "Réservé aux labels." };
  if (profile.label_plan === "none") {
    return {
      error: "Active un abonnement label d'abord.",
      actionHref: "/label/abonnement",
      actionLabel: "Abonnement Label",
    };
  }

  const { error } = await supabase.from("artists").insert({
    owner_id: user.id,
    label_id: user.id,
    stage_name,
    country,
    bio,
    avatar_url,
  });

  if (error) {
    logServerError("label.createArtist", error);
    return { error: mapDbError(error, "Impossible d'ajouter l'artiste.") };
  }

  if (profile.email) {
    notifyLabelArtistCreated({
      email: profile.email,
      stageName: stage_name,
      country,
      labelName: profile.display_name,
    });
  }

  revalidatePath("/label/artistes");
  revalidatePath("/label/statistiques");
  return { success: `Artiste « ${stage_name} » ajouté.` };
}

"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  isOperatorForCountry,
  type CountryCode,
} from "@/lib/constants";
import type { PaymentMethod } from "@/lib/supabase/database.types";
import type { ActionState } from "./profile";
import {
  createMbiyoPayout,
  getMbiyoTransaction,
} from "@/lib/mbiyo/client";
import {
  getMbiyoCurrency,
  getMbiyoMinAmount,
  isValidMbiyoPhone,
  mbiyoConfigured,
  normalizeMbiyoPhone,
  siteUrl,
  toMbiyoPhoneE164,
} from "@/lib/mbiyo/config";
import {
  failWithdrawalByOrderId,
  fulfillWithdrawalByOrderId,
} from "@/lib/mbiyo/fulfill";
import { checkLabelPlanStatus } from "@/lib/actions/label";
import { checkArtistPlanStatus } from "@/lib/actions/artist-plan";
import {
  logServerError,
  mapDbError,
  mapPaymentError,
} from "@/lib/errors";
import {
  currencyLabelForCountry,
  localToFcfa,
  toMbiyoPayAmount,
} from "@/lib/currency";
import {
  runCheckPurchaseStatus,
  runInitiatePurchase,
} from "@/lib/purchases/payin";

/** Achat réel via MBIYOPAY Collect (payin Mobile Money). */
export async function initiatePurchase(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const releaseId = String(formData.get("release_id") || "");
  const payment_method = String(
    formData.get("payment_method") || "",
  ) as PaymentMethod;
  const phoneRaw = String(formData.get("phone") || "").trim();

  const supabase = await createClient();
  return runInitiatePurchase(supabase, {
    releaseId,
    paymentMethod: payment_method,
    phoneRaw,
  });
}

/** @deprecated alias — utilise initiatePurchase */
export const simulatePurchase = initiatePurchase;

/** Vérifie le statut d'un paiement (polling + sync MBIYO). */
export async function checkPurchaseStatus(orderId: string) {
  const supabase = await createClient();
  return runCheckPurchaseStatus(supabase, orderId);
}

/** Payout Mobile Money — https://dashboard.mbiyo.africa/docs/reference/merchant/payout */
export async function initiateWithdrawal(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const amountLocal = Number(formData.get("amount") || 0);
  const phoneRaw = String(formData.get("phone") || "").trim();
  const payment_method = String(
    formData.get("payment_method") || "",
  ) as PaymentMethod;

  if (!amountLocal || amountLocal <= 0 || !phoneRaw || !payment_method) {
    return { error: "Montant, téléphone et opérateur requis." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance_fcfa, country, phone, display_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return { error: "Profil introuvable." };

  const country = (profile.country || "CG") as CountryCode;
  const amount = localToFcfa(amountLocal, country);
  const payAmount = toMbiyoPayAmount(amount, country);

  if (Number(profile.balance_fcfa) < amount) {
    return { error: "Solde insuffisant." };
  }

  if (!isOperatorForCountry(payment_method, country)) {
    return { error: "Cet opérateur n'est pas disponible dans ton pays." };
  }

  const minAmount = getMbiyoMinAmount(country);
  if (payAmount < minAmount) {
    return {
      error: `Montant minimum de retrait : ${minAmount} ${currencyLabelForCountry(country)}.`,
    };
  }

  const phone = normalizeMbiyoPhone(phoneRaw, country);
  if (!isValidMbiyoPhone(phone, country)) {
    return { error: "Numéro Mobile Money invalide pour ton pays." };
  }

  const currency = getMbiyoCurrency(country);
  const beneficiary =
    profile.display_name?.trim() ||
    profile.email?.split("@")[0] ||
    "Gootunes";
  const orderId = `WD-${randomUUID().slice(0, 10)}`;

  // Mode démo sans clé API
  if (!mbiyoConfigured()) {
    const { error } = await supabase.from("withdrawals").insert({
      profile_id: user.id,
      amount_fcfa: amount,
      payment_method,
      phone,
      status: "completed",
      order_id: orderId,
      provider: "demo",
      beneficiary,
      provider_meta: { mode: "demo_no_mbiyo_key" },
    });
    if (error) {
      logServerError("withdrawal.demo", error);
      return { error: mapDbError(error, "Impossible d'effectuer le retrait.") };
    }
    revalidatePath("/artist");
    revalidatePath("/label");
    revalidatePath("/artist/retraits");
    revalidatePath("/label/retraits");
    return { success: "Retrait démo effectué." };
  }

  // pending → trigger réserve le solde
  const { data: withdrawal, error: insertError } = await supabase
    .from("withdrawals")
    .insert({
      profile_id: user.id,
      amount_fcfa: amount,
      payment_method,
      phone,
      status: "pending",
      order_id: orderId,
      provider: "mbiyo",
      beneficiary,
      provider_meta: { currency, country_code: country, network: payment_method },
    })
    .select("id")
    .single();

  if (insertError || !withdrawal) {
    logServerError("withdrawal.insert", insertError);
    return {
      error: mapDbError(insertError, "Impossible de créer le retrait."),
    };
  }

  try {
    const res = await createMbiyoPayout({
      amount: payAmount,
      currency,
      payment_method: "mobile_money",
      order_id: orderId,
      callback_url: `${siteUrl()}/api/webhooks/mbiyo`,
      metadata: {
        network: payment_method,
        phone_number: toMbiyoPhoneE164(phone),
        country_code: country,
        beneficiary,
      },
    });

    const tx = res.data;
    await supabase
      .from("withdrawals")
      .update({
        provider_transaction_id: tx.transaction_id,
        provider_meta: {
          currency,
          country_code: country,
          network: payment_method,
          amount_fcfa: amount,
          amount_paid: payAmount,
          fee: tx.fee,
          charged_amount: tx.charged_amount,
          mbiyo_status: tx.status,
        },
      })
      .eq("id", withdrawal.id);

    if (tx.status === "successful") {
      await fulfillWithdrawalByOrderId(orderId, tx.transaction_id, {
        source: "payout_immediate",
      });
      return { success: "Retrait envoyé sur ton Mobile Money." };
    }

    if (tx.status === "failed" || tx.status === "cancelled") {
      await failWithdrawalByOrderId(orderId, tx.transaction_id);
      return { error: "Le retrait a échoué. Le solde a été rétabli." };
    }

    return {
      paymentPending: true,
      orderId,
      purchaseId: withdrawal.id,
      providerTransactionId: tx.transaction_id,
      success: "Retrait initié — envoi en cours vers ton Mobile Money.",
    };
  } catch (e) {
    await failWithdrawalByOrderId(orderId);
    logServerError("withdrawal.payout", e);
    return { error: mapPaymentError(e, "payout") };
  }
}

/** @deprecated alias */
export const simulateWithdrawal = initiateWithdrawal;

export async function checkWithdrawalStatus(orderId: string): Promise<{
  status: "pending" | "completed" | "failed" | "cancelled" | "unknown";
  message?: string;
}> {
  if (!orderId?.startsWith("WD-")) return { status: "unknown" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "unknown", message: "Non authentifié" };

  const { data: w } = await supabase
    .from("withdrawals")
    .select("id, status, provider_transaction_id, order_id")
    .eq("order_id", orderId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!w) return { status: "unknown", message: "Retrait introuvable" };
  if (w.status === "completed") return { status: "completed" };
  if (w.status === "failed" || w.status === "cancelled") {
    return { status: w.status };
  }

  if (!mbiyoConfigured()) return { status: "pending" };

  try {
    const lookup = w.provider_transaction_id || w.order_id || orderId;
    const res = await getMbiyoTransaction(lookup);
    const st = res.data.status;
    if (st === "successful") {
      await fulfillWithdrawalByOrderId(orderId, res.data.transaction_id, {
        source: "poll",
      });
      return { status: "completed" };
    }
    if (st === "failed" || st === "cancelled") {
      await failWithdrawalByOrderId(orderId, res.data.transaction_id);
      return { status: st === "cancelled" ? "cancelled" : "failed" };
    }
  } catch {
    /* pending */
  }

  return { status: "pending" };
}

/** Statut unifié (achat GT- / label LAB- / artiste ART- / retrait WD-). */
export async function checkPaymentOrderStatus(orderId: string): Promise<{
  status: "pending" | "completed" | "failed" | "cancelled" | "unknown";
  releaseId?: string;
  message?: string;
}> {
  if (!orderId) return { status: "unknown" };
  if (orderId.startsWith("LAB-")) {
    return checkLabelPlanStatus(orderId);
  }
  if (orderId.startsWith("ART-")) {
    return checkArtistPlanStatus(orderId);
  }
  if (orderId.startsWith("WD-")) {
    return checkWithdrawalStatus(orderId);
  }
  return checkPurchaseStatus(orderId);
}

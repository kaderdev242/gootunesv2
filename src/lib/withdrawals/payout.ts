import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isOperatorForCountry,
  type CountryCode,
} from "@/lib/constants";
import type { Database, PaymentMethod } from "@/lib/supabase/database.types";
import type { ActionState } from "@/lib/actions/profile";
import {
  createMbiyoPayout,
  getMbiyoTransaction,
} from "@/lib/mbiyo/client";
import {
  getMbiyoCurrency,
  getMbiyoMinAmount,
  isValidMbiyoPhone,
  mbiyoConfigured,
  mbiyoRequiredInProduction,
  normalizeMbiyoPhone,
  siteUrl,
  toMbiyoPhoneE164,
} from "@/lib/mbiyo/config";
import {
  failWithdrawalByOrderId,
  fulfillWithdrawalByOrderId,
} from "@/lib/mbiyo/fulfill";
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

type Sb = SupabaseClient<Database>;

function touchCreatorPaths() {
  revalidatePath("/artist");
  revalidatePath("/label");
  revalidatePath("/artist/retraits");
  revalidatePath("/label/retraits");
}

export async function runInitiateWithdrawal(
  supabase: Sb,
  input: {
    amountLocal: number;
    phoneRaw: string;
    paymentMethod: PaymentMethod;
  },
): Promise<ActionState> {
  const { amountLocal, phoneRaw, paymentMethod } = input;

  if (!amountLocal || amountLocal <= 0 || !phoneRaw || !paymentMethod) {
    return { error: "Montant, téléphone et opérateur requis." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance_fcfa, country, phone, display_name, email, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return { error: "Profil introuvable." };
  if (!profile.onboarding_completed) {
    return { error: "Termine ton onboarding sur gootunes.com/onboarding." };
  }

  const country = (profile.country || "CG") as CountryCode;
  const amount = localToFcfa(amountLocal, country);
  const payAmount = toMbiyoPayAmount(amount, country);

  if (Number(profile.balance_fcfa) < amount) {
    return { error: "Solde insuffisant." };
  }

  // Un seul retrait en cours à la fois : le solde n'est débité qu'à la
  // confirmation Mbiyo, donc deux retraits simultanés pourraient dépasser le solde.
  const { count: pendingCount } = await createAdminClient()
    .from("withdrawals")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .eq("status", "pending");
  if ((pendingCount ?? 0) > 0) {
    return {
      error: "Un retrait est déjà en cours. Attends sa confirmation avant d'en lancer un autre.",
    };
  }

  if (!isOperatorForCountry(paymentMethod, country)) {
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

  const mbiyoGate = mbiyoRequiredInProduction();
  if (mbiyoGate) {
    logServerError(
      "withdrawal.mbiyo_missing_production",
      new Error("MBIYO_API_KEY absente en production"),
    );
    return { error: mbiyoGate };
  }

  if (!mbiyoConfigured()) {
    const { error } = await createAdminClient().from("withdrawals").insert({
      profile_id: user.id,
      amount_fcfa: amount,
      payment_method: paymentMethod,
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
    touchCreatorPaths();
    return { success: "Retrait démo effectué." };
  }

  const { data: withdrawal, error: insertError } = await createAdminClient()
    .from("withdrawals")
    .insert({
      profile_id: user.id,
      amount_fcfa: amount,
      payment_method: paymentMethod,
      phone,
      status: "pending",
      order_id: orderId,
      provider: "mbiyo",
      beneficiary,
      provider_meta: { currency, country_code: country, network: paymentMethod },
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
        network: paymentMethod,
        phone_number: toMbiyoPhoneE164(phone),
        country_code: country,
        beneficiary,
      },
    });

    const tx = res.data;
    await createAdminClient()
      .from("withdrawals")
      .update({
        provider_transaction_id: tx.transaction_id,
        provider_meta: {
          currency,
          country_code: country,
          network: paymentMethod,
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

export async function runCheckWithdrawalStatus(
  supabase: Sb,
  orderId: string,
): Promise<{
  status: "pending" | "completed" | "failed" | "cancelled" | "unknown";
  message?: string;
}> {
  if (!orderId?.startsWith("WD-")) return { status: "unknown" };

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

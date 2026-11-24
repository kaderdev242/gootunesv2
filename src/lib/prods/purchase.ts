import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/actions/profile";
import {
  COMMISSION_RATE,
  isOperatorForCountry,
  type CountryCode,
} from "@/lib/constants";
import { currencyLabelForCountry, toMbiyoPayAmount } from "@/lib/currency";
import { logServerError, mapDbError, mapPaymentError } from "@/lib/errors";
import { createMbiyoPayin, getMbiyoTransaction } from "@/lib/mbiyo/client";
import {
  getMbiyoCurrency,
  getMbiyoMinAmount,
  isValidMbiyoPhone,
  mbiyoConfigured,
  mbiyoRequiredInProduction,
  normalizeMbiyoPhone,
  purchaseDevBypass,
  siteUrl,
  toMbiyoPhoneE164,
} from "@/lib/mbiyo/config";
import { payinErrorFailure, statusFailure } from "@/lib/mbiyo/failure";
import {
  isPendingOlderThanTtl,
  TTL_EXPIRE_SOURCE,
} from "@/lib/purchases/expire-pending";
import {
  BEAT_ORDER_PREFIX,
  beatPriceFor,
  isBeatLicense,
  licenseCovered,
  LICENSES,
} from "@/lib/prods/constants";
import { notifyBeatOrderCompleted } from "@/lib/email/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json, PaymentMethod } from "@/lib/supabase/database.types";
import { payinFormSchema } from "@/lib/validation/schemas";

type Sb = SupabaseClient<Database>;

export function revalidateBeatPurchase(publicId?: string) {
  revalidatePath("/prods/achats");
  if (publicId) revalidatePath(`/prods/b/${publicId}`);
  revalidatePath("/artist");
  revalidatePath("/label");
}

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/** Paiement d'une licence de prod — même flux Mbiyo que les achats musique, table dédiée. */
export async function runInitiateBeatPurchase(
  supabase: Sb,
  input: {
    beatId: string;
    license: string;
    paymentMethod: PaymentMethod;
    phoneRaw: string;
    omOtp?: string;
  },
): Promise<ActionState> {
  const parsed = payinFormSchema.safeParse({
    releaseId: input.beatId,
    paymentMethod: input.paymentMethod,
    phoneRaw: input.phoneRaw,
    omOtp: input.omOtp?.trim() ? input.omOtp.trim() : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Opérateur et numéro requis." };
  }
  if (!isBeatLicense(input.license)) return { error: "Licence invalide." };
  const license = input.license;
  const { paymentMethod: payment_method, phoneRaw, omOtp } = parsed.data;

  if (process.env.NODE_ENV === "production" && purchaseDevBypass()) {
    logServerError("prods.purchase.bypass_production", new Error("PURCHASE_DEV_BYPASS en production"));
    return { error: "Configuration invalide. Contactez le support." };
  }
  const gate = mbiyoRequiredInProduction();
  if (gate) return { error: gate };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connecte-toi pour acheter." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("country")
    .eq("id", user.id)
    .maybeSingle();
  const country = (profile?.country || "CG") as CountryCode;
  if (!isOperatorForCountry(payment_method as PaymentMethod, country)) {
    return { error: "Cet opérateur n'est pas disponible dans ton pays." };
  }

  const { data: beat } = await supabase
    .from("beats")
    .select("id, public_id, owner_id, title, status, is_hidden, price_mp3_fcfa, price_wav_fcfa, price_stems_fcfa")
    .eq("public_id", input.beatId)
    .eq("status", "published")
    .eq("is_hidden", false)
    .maybeSingle();
  if (!beat) return { error: "Prod introuvable." };
  if (beat.owner_id === user.id) return { error: "Tu ne peux pas acheter ta propre prod." };

  const amount = beatPriceFor(beat, license);
  if (!amount || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Cette licence n'est pas disponible pour cette prod." };
  }

  const admin = createAdminClient();
  // Déjà acquise, ou incluse dans une licence supérieure déjà achetée (stems ⊃ WAV ⊃ MP3).
  const { data: ownedRows } = await admin
    .from("beat_orders")
    .select("license")
    .eq("buyer_id", user.id)
    .eq("beat_id", beat.id)
    .eq("status", "completed");
  if (licenseCovered((ownedRows ?? []).map((r) => r.license), license)) {
    return {
      success: `Tu possèdes déjà la ${LICENSES[license].name} de « ${beat.title} » (ou une licence qui l'inclut).`,
      actionHref: "/prods/achats",
      actionLabel: "Mes téléchargements",
    };
  }

  const payAmount = toMbiyoPayAmount(amount, country);
  const minAmount = getMbiyoMinAmount(country);
  const bypass = purchaseDevBypass() || !mbiyoConfigured();
  if (!bypass && payAmount < minAmount) {
    return { error: `Montant minimum pour ce pays : ${minAmount} ${currencyLabelForCountry(country)}.` };
  }

  const commission = Math.round(amount * COMMISSION_RATE);
  const artistNet = amount - commission;
  const orderId = `${BEAT_ORDER_PREFIX}${beat.id.slice(0, 8)}-${randomUUID().slice(0, 8)}`;
  const phone = normalizeMbiyoPhone(phoneRaw, country);
  const currency = getMbiyoCurrency(country);

  if (!bypass && !isValidMbiyoPhone(phone, country)) {
    return {
      error:
        country === "CG"
          ? "Numéro invalide. Au Congo, utilise un mobile MTN (ex. 06 123 4567)."
          : "Numéro Mobile Money invalide pour ton pays.",
    };
  }

  const base = {
    order_id: orderId,
    buyer_id: user.id,
    seller_id: beat.owner_id,
    beat_id: beat.id,
    license,
    amount_fcfa: amount,
    commission_fcfa: commission,
    artist_net_fcfa: artistNet,
    payment_method: payment_method as PaymentMethod,
  };

  if (bypass) {
    const { data: demoOrder, error } = await admin.from("beat_orders").insert({
      ...base,
      status: "completed",
      provider: "demo",
      payer_phone: phone || "demo",
      provider_meta: { mode: purchaseDevBypass() ? "dev_bypass" : "demo_no_mbiyo_key" },
    }).select("id").single();
    if (error) {
      logServerError("prods.purchase.demo", error);
      return { error: mapDbError(error, "Impossible de finaliser l'achat.") };
    }
    if (demoOrder) void notifyBeatOrderCompleted(demoOrder.id);
    revalidateBeatPurchase(beat.public_id);
    return {
      success: `Achat test de « ${beat.title} » (paiement désactivé).`,
      actionHref: "/prods/achats",
      actionLabel: "Télécharger",
    };
  }

  const { data: order, error: insertError } = await admin
    .from("beat_orders")
    .insert({
      ...base,
      status: "pending",
      provider: "mbiyo",
      payer_phone: phone,
      provider_meta: { currency, country_code: country, network: payment_method },
    })
    .select("id")
    .single();
  if (insertError || !order) {
    logServerError("prods.purchase.insert", insertError);
    return { error: mapDbError(insertError, "Impossible de créer la commande.") };
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
        ...(omOtp ? { om_otp: omOtp } : {}),
      },
    });
    const tx = res.data;
    await admin
      .from("beat_orders")
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
          auth_mode: tx.auth_mode ?? null,
          mbiyo_status: tx.status,
        },
      })
      .eq("id", order.id);

    if (tx.status === "successful") {
      await fulfillBeatOrderByOrderId(orderId, tx.transaction_id, { source: "payin_immediate" });
      return {
        success: `Achat de « ${beat.title} » réussi.`,
        actionHref: "/prods/achats",
        actionLabel: "Télécharger",
      };
    }
    if (tx.status === "failed" || tx.status === "cancelled") {
      await failBeatOrderByOrderId(orderId, tx.transaction_id, statusFailure("payin_immediate", tx.status, res.message));
      return { error: "Le paiement a échoué. Réessaie avec un autre numéro." };
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
    const failure = payinErrorFailure(e);
    await failBeatOrderByOrderId(orderId, failure.transactionId, failure.meta);
    logServerError("prods.purchase.payin", e);
    return { error: mapPaymentError(e, "payin") };
  }
}

export async function runCheckBeatOrderStatus(
  supabase: Sb,
  orderId: string,
): Promise<{ status: "pending" | "completed" | "failed" | "cancelled" | "unknown" }> {
  if (!orderId.startsWith(BEAT_ORDER_PREFIX)) return { status: "unknown" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "unknown" };

  const { data: order } = await supabase
    .from("beat_orders")
    .select("status, provider, provider_transaction_id, created_at")
    .eq("order_id", orderId)
    .eq("buyer_id", user.id)
    .maybeSingle();
  if (!order) return { status: "unknown" };
  if (order.status !== "pending") return { status: order.status };
  if (!mbiyoConfigured()) return { status: "pending" };

  try {
    const res = await getMbiyoTransaction(order.provider_transaction_id || orderId);
    const st = res.data.status;
    if (st === "successful") {
      await fulfillBeatOrderByOrderId(orderId, res.data.transaction_id, { source: "poll" });
      return { status: "completed" };
    }
    if (st === "failed" || st === "cancelled") {
      await failBeatOrderByOrderId(orderId, res.data.transaction_id, statusFailure("poll", st));
      return { status: st };
    }
  } catch {
    /* reste pending */
  }

  if (isPendingOlderThanTtl(order.created_at)) {
    await failBeatOrderByOrderId(orderId, order.provider_transaction_id, {
      source: TTL_EXPIRE_SOURCE,
      expired_at: new Date().toISOString(),
      via: "poll",
    });
    return { status: "failed" };
  }
  return { status: "pending" };
}

/** pending → completed (le trigger SQL crédite le solde du vendeur). */
export async function fulfillBeatOrderByOrderId(
  orderId: string,
  providerTransactionId?: string | null,
  meta?: Json,
) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("beat_orders")
    .select("id, status, provider_meta, beats(public_id)")
    .eq("order_id", orderId)
    .maybeSingle();
  if (!order) return { ok: false as const, reason: "not_found" as const };
  if (order.status === "completed") return { ok: true as const, already: true as const };

  const prev = asObject(order.provider_meta);
  // Mbiyo fait foi : une commande en échec chez nous mais payée se débloque.
  if (order.status !== "pending" && order.status !== "failed") {
    return { ok: false as const, reason: "not_pending" as const };
  }

  const { error } = await admin
    .from("beat_orders")
    .update({
      status: "completed",
      provider_transaction_id: providerTransactionId || undefined,
      provider_meta: { ...prev, ...asObject(meta ?? null) } as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .eq("status", order.status);
  if (error) return { ok: false as const, reason: "update_failed" as const };

  void notifyBeatOrderCompleted(order.id);
  const beat = order.beats as { public_id?: string } | null;
  revalidateBeatPurchase(beat?.public_id);
  return { ok: true as const, already: false as const };
}

export async function failBeatOrderByOrderId(
  orderId: string,
  providerTransactionId?: string | null,
  meta?: Json,
) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("beat_orders")
    .select("provider_meta")
    .eq("order_id", orderId)
    .maybeSingle();
  await admin
    .from("beat_orders")
    .update({
      status: "failed",
      provider_transaction_id: providerTransactionId || undefined,
      provider_meta: { ...asObject(data?.provider_meta), ...asObject(meta ?? null) } as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)
    .eq("status", "pending");
}

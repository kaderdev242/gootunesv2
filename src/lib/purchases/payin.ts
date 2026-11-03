import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  COMMISSION_RATE,
  isOperatorForCountry,
  type CountryCode,
} from "@/lib/constants";
import type { ActionState } from "@/lib/actions/profile";
import { createMbiyoPayin, getMbiyoTransaction } from "@/lib/mbiyo/client";
import {
  getMbiyoCurrency,
  getMbiyoMinAmount,
  isValidMbiyoPhone,
  mbiyoConfigured,
  normalizeMbiyoPhone,
  mbiyoRequiredInProduction,
  purchaseDevBypass,
  siteUrl,
  toMbiyoPhoneE164,
} from "@/lib/mbiyo/config";
import {
  failPurchaseByOrderId,
  fulfillPurchaseByOrderId,
} from "@/lib/mbiyo/fulfill";
import {
  isPendingOlderThanTtl,
  TTL_EXPIRE_SOURCE,
} from "@/lib/purchases/expire-pending";
import { notifyPurchaseCompleted } from "@/lib/email/notify";
import {
  logServerError,
  mapDbError,
  mapPaymentError,
} from "@/lib/errors";
import { payinFormSchema } from "@/lib/validation/schemas";
import {
  currencyLabelForCountry,
  toMbiyoPayAmount,
} from "@/lib/currency";
import type { Database, PaymentMethod } from "@/lib/supabase/database.types";

type Sb = SupabaseClient<Database>;

function revalidatePurchasePaths(releaseId: string) {
  revalidatePath("/discover");
  revalidatePath(`/discover/release/${releaseId}`);
  revalidatePath(`/discover/release/${releaseId}/acheter`);
  revalidatePath("/discover/bibliotheque");
  revalidatePath("/artist");
  revalidatePath("/label");
}

async function findPublishedRelease(supabase: Sb, releaseId: string) {
  const select =
    "id, public_id, owner_id, price_fcfa, status, title, is_hidden" as const;

  const byId = await supabase
    .from("releases")
    .select(select)
    .eq("id", releaseId)
    .eq("status", "published")
    .eq("is_hidden", false)
    .maybeSingle();

  if (byId.data) return byId.data;

  const byPublic = await supabase
    .from("releases")
    .select(select)
    .eq("public_id", releaseId)
    .eq("status", "published")
    .eq("is_hidden", false)
    .maybeSingle();

  return byPublic.data;
}

/** Core payin MBIYO — utilisé par Server Action web + API mobile. */
export async function runInitiatePurchase(
  supabase: Sb,
  input: {
    releaseId: string;
    paymentMethod: PaymentMethod;
    phoneRaw: string;
    omOtp?: string;
  },
): Promise<ActionState> {
  const parsed = payinFormSchema.safeParse({
    ...input,
    omOtp: input.omOtp?.trim() ? input.omOtp.trim() : undefined,
  });
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ||
        "Publication, opérateur et numéro requis.",
    };
  }
  const {
    releaseId,
    paymentMethod: payment_method,
    phoneRaw,
    omOtp,
  } = parsed.data;

  // ── Gardes de sécurité production ──────────────────────────────────────────
  if (process.env.NODE_ENV === "production" && purchaseDevBypass()) {
    logServerError(
      "purchase.bypass_production",
      new Error("PURCHASE_DEV_BYPASS=1 activé en production — achat bloqué"),
    );
    return { error: "Configuration invalide. Contactez le support." };
  }
  const mbiyoGate = mbiyoRequiredInProduction();
  if (mbiyoGate) {
    logServerError(
      "purchase.mbiyo_missing_production",
      new Error("MBIYO_API_KEY absente en production — achat bloqué"),
    );
    return { error: mbiyoGate };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connecte-toi pour acheter." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("country, phone")
    .eq("id", user.id)
    .maybeSingle();

  const country = (profile?.country || "CG") as CountryCode;
  if (!isOperatorForCountry(payment_method, country)) {
    return { error: "Cet opérateur n'est pas disponible dans ton pays." };
  }

  const release = await findPublishedRelease(supabase, releaseId);
  if (!release) return { error: "Publication introuvable." };
  if (release.owner_id === user.id) {
    return { error: "Tu ne peux pas acheter ta propre publication." };
  }

  const releasePathId = release.public_id || release.id;

  const { data: already } = await supabase
    .from("library_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("release_id", release.id)
    .maybeSingle();

  if (already) {
    return {
      success: `« ${release.title} » est déjà dans ta bibliothèque.`,
      actionHref: `/discover/release/${releasePathId}`,
      actionLabel: "Écouter",
    };
  }

  const amount = Number(release.price_fcfa);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Prix invalide." };
  }

  const payAmount = toMbiyoPayAmount(amount, country);
  const minAmount = getMbiyoMinAmount(country);
  const bypass = purchaseDevBypass() || !mbiyoConfigured();
  if (!bypass && payAmount < minAmount) {
    return {
      error: `Montant minimum pour ce pays : ${minAmount} ${currencyLabelForCountry(country)}.`,
    };
  }

  const commission = Math.round(amount * COMMISSION_RATE);
  const artistNet = amount - commission;
  const orderId = `GT-${release.id.slice(0, 8)}-${randomUUID().slice(0, 8)}`;
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

  if (bypass) {
    const demoMode = purchaseDevBypass()
      ? "dev_bypass"
      : "demo_no_mbiyo_key";
    const { data: demoPurchase, error } = await createAdminClient()
      .from("purchases")
      .insert({
        buyer_id: user.id,
        seller_id: release.owner_id,
        release_id: release.id,
        amount_fcfa: amount,
        commission_fcfa: commission,
        artist_net_fcfa: artistNet,
        payment_method,
        status: "completed",
        order_id: orderId,
        provider: "demo",
        payer_phone: phone || "demo",
        provider_meta: { mode: demoMode },
      })
      .select("id")
      .single();
    if (error) {
      logServerError("purchase.demo", error);
      return { error: mapDbError(error, "Impossible de finaliser l'achat.") };
    }
    if (demoPurchase) void notifyPurchaseCompleted(demoPurchase.id);
    revalidatePurchasePaths(releasePathId);
    return {
      success:
        demoMode === "dev_bypass"
          ? `Achat test de « ${release.title} » (paiement désactivé).`
          : `Achat démo de « ${release.title} » (paiement non configuré).`,
      actionHref: `/discover/release/${releasePathId}`,
      actionLabel: "Écouter en entier",
    };
  }

  const { data: purchase, error: insertError } = await createAdminClient()
    .from("purchases")
    .insert({
      buyer_id: user.id,
      seller_id: release.owner_id,
      release_id: release.id,
      amount_fcfa: amount,
      commission_fcfa: commission,
      artist_net_fcfa: artistNet,
      payment_method,
      status: "pending",
      order_id: orderId,
      provider: "mbiyo",
      payer_phone: phone,
      provider_meta: {
        currency,
        country_code: country,
        network: payment_method,
      },
    })
    .select("id")
    .single();

  if (insertError || !purchase) {
    logServerError("purchase.insert", insertError);
    return {
      error: mapDbError(insertError, "Impossible de créer la commande."),
    };
  }

  try {
    const callbackUrl = `${siteUrl()}/api/webhooks/mbiyo`;
    const res = await createMbiyoPayin({
      amount: payAmount,
      currency,
      payment_method: "mobile_money",
      order_id: orderId,
      callback_url: callbackUrl,
      metadata: {
        network: payment_method,
        phone_number: toMbiyoPhoneE164(phone),
        country_code: country,
        ...(omOtp ? { om_otp: omOtp } : {}),
      },
    });

    const tx = res.data;
    await createAdminClient()
      .from("purchases")
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
      .eq("id", purchase.id);

    if (tx.status === "successful") {
      await fulfillPurchaseByOrderId(orderId, tx.transaction_id, {
        source: "payin_immediate",
      });
      revalidatePurchasePaths(releasePathId);
      return {
        success: `Achat de « ${release.title} » réussi.`,
        actionHref: `/discover/release/${releasePathId}`,
        actionLabel: "Écouter en entier",
      };
    }

    if (tx.status === "failed" || tx.status === "cancelled") {
      await failPurchaseByOrderId(orderId, tx.transaction_id);
      return { error: "Le paiement a échoué. Réessaie avec un autre numéro." };
    }

    return {
      paymentPending: true,
      orderId,
      purchaseId: purchase.id,
      providerTransactionId: tx.transaction_id,
      instructionsHtml: tx.instructions ?? null,
      authMode: tx.auth_mode ?? null,
      redirectUrl: tx.redirect_url ?? null,
      success: "Paiement initié — valide sur ton téléphone Mobile Money.",
    };
  } catch (e) {
    await failPurchaseByOrderId(orderId);
    logServerError("purchase.payin", e);
    const mapped = mapPaymentError(e, "payin");
    if (country === "CG" && mapped.includes("Numéro ou opérateur")) {
      return {
        error:
          "Numéro ou réseau non accepté. Vérifie un numéro MTN Congo (06…) et réessaie.",
      };
    }
    return { error: mapped };
  }
}

export async function runCheckPurchaseStatus(
  supabase: Sb,
  orderId: string,
): Promise<{
  status: "pending" | "completed" | "failed" | "cancelled" | "unknown";
  releaseId?: string;
  message?: string;
}> {
  if (!orderId) return { status: "unknown" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "unknown", message: "Non authentifié" };

  const { data: purchase } = await supabase
    .from("purchases")
    .select(
      "id, status, release_id, provider_transaction_id, order_id, created_at, provider",
    )
    .eq("order_id", orderId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (!purchase) return { status: "unknown", message: "Commande introuvable" };

  if (purchase.status === "completed") {
    return { status: "completed", releaseId: purchase.release_id };
  }
  if (purchase.status === "failed" || purchase.status === "cancelled") {
    return { status: purchase.status, releaseId: purchase.release_id };
  }

  if (!mbiyoConfigured()) {
    return { status: "pending", releaseId: purchase.release_id };
  }

  try {
    const lookup =
      purchase.provider_transaction_id || purchase.order_id || orderId;
    const res = await getMbiyoTransaction(lookup);
    const st = res.data.status;

    if (st === "successful") {
      await fulfillPurchaseByOrderId(orderId, res.data.transaction_id, {
        source: "poll",
      });
      return { status: "completed", releaseId: purchase.release_id };
    }
    if (st === "failed" || st === "cancelled") {
      await failPurchaseByOrderId(orderId, res.data.transaction_id);
      return {
        status: st === "cancelled" ? "cancelled" : "failed",
        releaseId: purchase.release_id,
      };
    }
  } catch {
    /* garde pending */
  }

  // TTL 5 min : si toujours pending côté PSP, marquer échec.
  if (
    purchase.provider !== "apple" &&
    isPendingOlderThanTtl(purchase.created_at)
  ) {
    await failPurchaseByOrderId(orderId, purchase.provider_transaction_id, {
      source: TTL_EXPIRE_SOURCE,
      expired_at: new Date().toISOString(),
      via: "poll",
    });
    return { status: "failed", releaseId: purchase.release_id };
  }

  return { status: "pending", releaseId: purchase.release_id };
}

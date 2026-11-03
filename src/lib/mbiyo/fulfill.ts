import { createAdminClient } from "@/lib/supabase/admin";
import { LABEL_PLANS } from "@/lib/constants";
import { notifyPurchaseCompleted } from "@/lib/email/notify";
import { isTtlExpireMeta } from "@/lib/purchases/expire-pending";
import type { Json, LabelPlan } from "@/lib/supabase/database.types";
import { revalidatePath } from "next/cache";

function canFulfillFromStatus(
  status: string,
  providerMeta: unknown,
): status is "pending" | "failed" {
  if (status === "pending") return true;
  return status === "failed" && isTtlExpireMeta(providerMeta);
}

/** Marque un achat comme completed (trigger → solde + library). */
export async function fulfillPurchaseByOrderId(
  orderId: string,
  providerTransactionId?: string | null,
  meta?: Json,
) {
  const admin = createAdminClient();

  const { data: purchase } = await admin
    .from("purchases")
    .select("id, release_id, status, provider_meta")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!purchase) return { ok: false as const, reason: "not_found" as const };
  if (purchase.status === "completed") {
    return { ok: true as const, already: true as const, purchase };
  }
  if (!canFulfillFromStatus(purchase.status, purchase.provider_meta)) {
    return { ok: false as const, reason: "not_pending" as const };
  }

  const { error } = await admin
    .from("purchases")
    .update({
      status: "completed",
      provider_transaction_id: providerTransactionId || undefined,
      provider_meta: meta ?? {},
    })
    .eq("id", purchase.id)
    .eq("status", purchase.status);

  if (error) return { ok: false as const, reason: "update_failed" as const };

  void notifyPurchaseCompleted(purchase.id);

  revalidatePath("/discover");
  revalidatePath(`/discover/release/${purchase.release_id}`);
  revalidatePath(`/discover/release/${purchase.release_id}/acheter`);
  revalidatePath("/discover/bibliotheque");
  revalidatePath("/artist");
  revalidatePath("/label");

  return { ok: true as const, already: false as const, purchase };
}

export async function failPurchaseByOrderId(
  orderId: string,
  providerTransactionId?: string | null,
  meta?: Json,
) {
  const admin = createAdminClient();
  await admin
    .from("purchases")
    .update({
      status: "failed",
      provider_transaction_id: providerTransactionId || undefined,
      provider_meta: meta ?? {},
    })
    .eq("order_id", orderId)
    .eq("status", "pending");
}

/** Active l'abonnement label après payin réussi. */
export async function fulfillLabelPlanByOrderId(
  orderId: string,
  providerTransactionId?: string | null,
  meta?: Json,
) {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("label_plan_orders")
    .select("id, user_id, plan, status, provider_meta")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!order) return { ok: false as const, reason: "not_found" as const };
  if (order.status === "completed") {
    return { ok: true as const, already: true as const, order };
  }
  if (!canFulfillFromStatus(order.status, order.provider_meta)) {
    return { ok: false as const, reason: "not_pending" as const };
  }

  const plan = order.plan as Exclude<LabelPlan, "none">;
  if (plan !== "starter" && plan !== "unlimited") {
    return { ok: false as const, reason: "invalid_plan" as const };
  }

  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  const { error: orderErr } = await admin
    .from("label_plan_orders")
    .update({
      status: "completed",
      provider_transaction_id: providerTransactionId || undefined,
      provider_meta: meta ?? {},
    })
    .eq("id", order.id)
    .eq("status", order.status);

  if (orderErr) return { ok: false as const, reason: "update_failed" as const };

  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      label_plan: plan,
      label_plan_expires_at: expires.toISOString(),
    })
    .eq("id", order.user_id);

  if (profileErr) {
    return { ok: false as const, reason: "profile_failed" as const };
  }

  revalidatePath("/label");
  revalidatePath("/label/abonnement");
  revalidatePath("/label/artistes");

  return {
    ok: true as const,
    already: false as const,
    order,
    planName: LABEL_PLANS[plan].name,
    expires,
  };
}

export async function failLabelPlanByOrderId(
  orderId: string,
  providerTransactionId?: string | null,
  meta?: Json,
) {
  const admin = createAdminClient();
  await admin
    .from("label_plan_orders")
    .update({
      status: "failed",
      provider_transaction_id: providerTransactionId || undefined,
      provider_meta: meta ?? {},
    })
    .eq("order_id", orderId)
    .eq("status", "pending");
}

/** Active l'abonnement artiste annuel après payin réussi. */
export async function fulfillArtistPlanByOrderId(
  orderId: string,
  providerTransactionId?: string | null,
  meta?: Json,
) {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("artist_plan_orders")
    .select("id, user_id, plan, status, provider_meta")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!order) return { ok: false as const, reason: "not_found" as const };
  if (order.status === "completed") {
    return { ok: true as const, already: true as const, order };
  }
  if (!canFulfillFromStatus(order.status, order.provider_meta)) {
    return { ok: false as const, reason: "not_pending" as const };
  }
  if (order.plan !== "annual") {
    return { ok: false as const, reason: "invalid_plan" as const };
  }

  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  const { error: orderErr } = await admin
    .from("artist_plan_orders")
    .update({
      status: "completed",
      provider_transaction_id: providerTransactionId || undefined,
      provider_meta: meta ?? {},
    })
    .eq("id", order.id)
    .eq("status", order.status);

  if (orderErr) return { ok: false as const, reason: "update_failed" as const };

  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      artist_plan: "annual",
      artist_plan_expires_at: expires.toISOString(),
    })
    .eq("id", order.user_id);

  if (profileErr) {
    return { ok: false as const, reason: "profile_failed" as const };
  }

  revalidatePath("/artist");
  revalidatePath("/artist/abonnement");
  revalidatePath("/artist/publier");
  revalidatePath("/artist/publications");

  return {
    ok: true as const,
    already: false as const,
    order,
    expires,
  };
}

export async function failArtistPlanByOrderId(
  orderId: string,
  providerTransactionId?: string | null,
  meta?: Json,
) {
  const admin = createAdminClient();
  await admin
    .from("artist_plan_orders")
    .update({
      status: "failed",
      provider_transaction_id: providerTransactionId || undefined,
      provider_meta: meta ?? {},
    })
    .eq("order_id", orderId)
    .eq("status", "pending");
}

/** Confirme un retrait payout (solde déjà réservé au pending). */
export async function fulfillWithdrawalByOrderId(
  orderId: string,
  providerTransactionId?: string | null,
  meta?: Json,
) {
  const admin = createAdminClient();

  const { data: w } = await admin
    .from("withdrawals")
    .select("id, status, profile_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!w) return { ok: false as const, reason: "not_found" as const };
  if (w.status === "completed") {
    return { ok: true as const, already: true as const, withdrawal: w };
  }

  const { error } = await admin
    .from("withdrawals")
    .update({
      status: "completed",
      provider_transaction_id: providerTransactionId || undefined,
      provider_meta: meta ?? {},
    })
    .eq("id", w.id)
    .eq("status", "pending");

  if (error) return { ok: false as const, reason: "update_failed" as const };

  revalidatePath("/artist");
  revalidatePath("/label");
  revalidatePath("/artist/retraits");
  revalidatePath("/label/retraits");

  return { ok: true as const, already: false as const, withdrawal: w };
}

export async function failWithdrawalByOrderId(
  orderId: string,
  providerTransactionId?: string | null,
  meta?: Json,
) {
  const admin = createAdminClient();
  await admin
    .from("withdrawals")
    .update({
      status: "failed",
      provider_transaction_id: providerTransactionId || undefined,
      provider_meta: meta ?? {},
    })
    .eq("order_id", orderId)
    .eq("status", "pending");
  // trigger rembourse le solde

  revalidatePath("/artist/retraits");
  revalidatePath("/label/retraits");
}

/** Dispatch fulfill selon préfixe order_id (GT / LAB / ART / WD). */
export async function fulfillByOrderId(
  orderId: string,
  providerTransactionId?: string | null,
  meta?: Json,
) {
  if (orderId.startsWith("LAB-")) {
    return fulfillLabelPlanByOrderId(orderId, providerTransactionId, meta);
  }
  if (orderId.startsWith("ART-")) {
    return fulfillArtistPlanByOrderId(orderId, providerTransactionId, meta);
  }
  if (orderId.startsWith("WD-")) {
    return fulfillWithdrawalByOrderId(orderId, providerTransactionId, meta);
  }
  return fulfillPurchaseByOrderId(orderId, providerTransactionId, meta);
}

export async function failByOrderId(
  orderId: string,
  providerTransactionId?: string | null,
  meta?: Json,
) {
  if (orderId.startsWith("LAB-")) {
    return failLabelPlanByOrderId(orderId, providerTransactionId, meta);
  }
  if (orderId.startsWith("ART-")) {
    return failArtistPlanByOrderId(orderId, providerTransactionId, meta);
  }
  if (orderId.startsWith("WD-")) {
    return failWithdrawalByOrderId(orderId, providerTransactionId, meta);
  }
  return failPurchaseByOrderId(orderId, providerTransactionId, meta);
}

/** Montant et devise attendus pour une commande (contrôle anti-fraude webhook). */
export async function getExpectedPayment(orderId: string): Promise<{
  found: boolean;
  amount: number | null;
  currency: string | null;
}> {
  const table = orderId.startsWith("LAB-")
    ? "label_plan_orders"
    : orderId.startsWith("ART-")
      ? "artist_plan_orders"
      : orderId.startsWith("WD-")
        ? "withdrawals"
        : "purchases";
  const admin = createAdminClient();
  const { data } = await admin
    .from(table)
    .select("provider_meta")
    .eq("order_id", orderId)
    .maybeSingle();
  if (!data) return { found: false, amount: null, currency: null };
  const meta = (data.provider_meta ?? {}) as Record<string, unknown>;
  const raw = meta.amount_charged ?? meta.amount_paid;
  const amount = typeof raw === "number" && Number.isFinite(raw) ? raw : null;
  const currency = typeof meta.currency === "string" ? meta.currency : null;
  return { found: true, amount, currency };
}

import { createAdminClient } from "@/lib/supabase/admin";
import { LABEL_PLANS } from "@/lib/constants";
import { notifyPurchaseCompleted } from "@/lib/email/notify";
import type { Json, LabelPlan } from "@/lib/supabase/database.types";
import { revalidatePath } from "next/cache";

/** Marque un achat comme completed (trigger → solde + library). */
export async function fulfillPurchaseByOrderId(
  orderId: string,
  providerTransactionId?: string | null,
  meta?: Json,
) {
  const admin = createAdminClient();

  const { data: purchase } = await admin
    .from("purchases")
    .select("id, release_id, status")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!purchase) return { ok: false as const, reason: "not_found" as const };
  if (purchase.status === "completed") {
    return { ok: true as const, already: true as const, purchase };
  }

  const { error } = await admin
    .from("purchases")
    .update({
      status: "completed",
      provider_transaction_id: providerTransactionId || undefined,
      provider_meta: meta ?? {},
    })
    .eq("id", purchase.id)
    .eq("status", "pending");

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
    .select("id, user_id, plan, status")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!order) return { ok: false as const, reason: "not_found" as const };
  if (order.status === "completed") {
    return { ok: true as const, already: true as const, order };
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
    .eq("status", "pending");

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
    .select("id, user_id, plan, status")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!order) return { ok: false as const, reason: "not_found" as const };
  if (order.status === "completed") {
    return { ok: true as const, already: true as const, order };
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
    .eq("status", "pending");

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

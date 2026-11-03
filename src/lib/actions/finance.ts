"use server";

import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod } from "@/lib/supabase/database.types";
import type { ActionState } from "./profile";
import { checkLabelPlanStatus } from "@/lib/actions/label";
import { checkArtistPlanStatus } from "@/lib/actions/artist-plan";
import {
  runCheckPurchaseStatus,
  runInitiatePurchase,
} from "@/lib/purchases/payin";
import {
  runCheckWithdrawalStatus,
  runInitiateWithdrawal,
} from "@/lib/withdrawals/payout";

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
  const omOtp = String(formData.get("om_otp") || "").trim();

  const supabase = await createClient();
  return runInitiatePurchase(supabase, {
    releaseId,
    paymentMethod: payment_method,
    phoneRaw,
    omOtp,
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
  const supabase = await createClient();
  return runInitiateWithdrawal(supabase, {
    amountLocal: Number(formData.get("amount") || 0),
    phoneRaw: String(formData.get("phone") || "").trim(),
    paymentMethod: String(formData.get("payment_method") || "") as PaymentMethod,
  });
}

/** @deprecated alias */
export const simulateWithdrawal = initiateWithdrawal;

export async function checkWithdrawalStatus(orderId: string): Promise<{
  status: "pending" | "completed" | "failed" | "cancelled" | "unknown";
  message?: string;
}> {
  const supabase = await createClient();
  return runCheckWithdrawalStatus(supabase, orderId);
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

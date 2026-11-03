import { NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request-client";
import type { PaymentMethod } from "@/lib/supabase/database.types";
import {
  isCreatorSession,
  payoutMeta,
  publicCreatorProfile,
  requireCreatorApi,
} from "@/lib/creator/require-api";
import {
  runCheckWithdrawalStatus,
  runInitiateWithdrawal,
} from "@/lib/withdrawals/payout";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireCreatorApi(request);
  if (!isCreatorSession(session)) return session;

  const supabase = await createRequestClient(request);
  const { data: withdrawals } = await supabase
    .from("withdrawals")
    .select(
      "id, amount_fcfa, payment_method, phone, status, order_id, created_at",
    )
    .eq("profile_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(80);

  return NextResponse.json({
    profile: publicCreatorProfile(session.profile),
    payout: payoutMeta(session.profile),
    withdrawals: (withdrawals ?? []).map((w) => ({
      id: w.id,
      amount_fcfa: Number(w.amount_fcfa) || 0,
      payment_method: w.payment_method,
      phone: w.phone,
      status: w.status,
      order_id: w.order_id,
      created_at: w.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireCreatorApi(request, { money: true });
  if (!isCreatorSession(session)) return session;

  let body: {
    amount?: number;
    phone?: string;
    payment_method?: string;
    order_id?: string;
    action?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const supabase = await createRequestClient(request);

  if (body.action === "status" && body.order_id) {
    const status = await runCheckWithdrawalStatus(supabase, String(body.order_id));
    return NextResponse.json(status);
  }

  const result = await runInitiateWithdrawal(supabase, {
    amountLocal: Number(body.amount || 0),
    phoneRaw: String(body.phone || "").trim(),
    paymentMethod: String(body.payment_method || "") as PaymentMethod,
  });

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}

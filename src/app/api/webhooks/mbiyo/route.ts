import { NextRequest, NextResponse } from "next/server";
import { verifyMbiyoWebhookSignature } from "@/lib/mbiyo/client";
import { failByOrderId, fulfillByOrderId } from "@/lib/mbiyo/fulfill";
import type { Json } from "@/lib/supabase/database.types";
import { mbiyoWebhookSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook MBIYOPAY — cashin (achat / abonnement) + cashout (retrait)
 * @see https://dashboard.mbiyo.africa/docs/reference/merchant/payin
 * @see https://dashboard.mbiyo.africa/docs/reference/merchant/payout
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("signature") ||
    request.headers.get("Signature") ||
    request.headers.get("x-mbiyo-signature");

  if (!verifyMbiyoWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = mbiyoWebhookSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload incomplet" }, { status: 400 });
  }
  const payload = parsed.data;

  const status = String(payload.status).toLowerCase();

  try {
    if (
      status === "successful" ||
      status === "success" ||
      status === "completed"
    ) {
      await fulfillByOrderId(payload.order_id, payload.transaction_id, {
        source: "webhook",
        type: payload.type ?? null,
        webhook_status: payload.status,
        amount: payload.amount,
        fee: payload.fee ?? null,
        charged_amount: payload.charged_amount ?? null,
        metadata: (payload.metadata ?? {}) as Json,
      });
    } else if (status === "failed" || status === "cancelled") {
      await failByOrderId(payload.order_id, payload.transaction_id, {
        source: "webhook",
        type: payload.type ?? null,
        webhook_status: payload.status,
      });
    }
  } catch (e) {
    console.error("[mbiyo webhook]", e);
    return NextResponse.json({ error: "Traitement impossible" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

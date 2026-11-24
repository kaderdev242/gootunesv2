import { createAdminClient } from "@/lib/supabase/admin";

export type PaymentEventSource = "webhook" | "reconcile" | "admin";

export type PaymentEvent = {
  id: string;
  order_id: string | null;
  transaction_id: string | null;
  source: PaymentEventSource;
  mbiyo_status: string | null;
  outcome: string;
  detail: string;
  actor_id: string | null;
  created_at: string;
};

/** Trace un événement de paiement. Ne lève jamais (ne bloque pas un paiement). */
export async function recordPaymentEvent(event: {
  orderId?: string | null;
  transactionId?: string | null;
  source: PaymentEventSource;
  mbiyoStatus?: string | null;
  outcome: string;
  detail?: string;
  actorId?: string | null;
}): Promise<void> {
  try {
    // Table ajoutée en migration 035, pas encore dans database.types générés.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (createAdminClient() as any).from("payment_events").insert({
      order_id: event.orderId ?? null,
      transaction_id: event.transactionId ?? null,
      source: event.source,
      mbiyo_status: event.mbiyoStatus ?? null,
      outcome: event.outcome,
      detail: (event.detail ?? "").slice(0, 1000),
      actor_id: event.actorId ?? null,
    });
  } catch (e) {
    console.error("[payment_events]", e);
  }
}

/** Historique d'une commande, du plus récent au plus ancien. */
export async function listPaymentEvents(orderId: string): Promise<PaymentEvent[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (createAdminClient() as any)
    .from("payment_events")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as PaymentEvent[];
}

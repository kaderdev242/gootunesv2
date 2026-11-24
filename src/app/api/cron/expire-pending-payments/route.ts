import { NextResponse } from "next/server";
import { reconcileMbiyoPayins } from "@/lib/mbiyo/reconcile";
import { logServerError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Rapproche avec Mbiyo les paiements en attente (> 5 min) et les échecs
 * non confirmés des 72 dernières heures : livre ce qui a été payé, passe en
 * échec ce que Mbiyo a refusé. À appeler toutes les 5 à 10 minutes.
 * Auth : Bearer / x-admin-secret = CRON_SECRET.
 */
async function handle(request: Request) {
  try {
    const secret =
      request.headers.get("x-admin-secret") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const expected = process.env.CRON_SECRET?.trim();
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const result = await reconcileMbiyoPayins(40);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logServerError("cron.expirePendingPayments", e);
    return NextResponse.json({ error: "Échec expiration" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

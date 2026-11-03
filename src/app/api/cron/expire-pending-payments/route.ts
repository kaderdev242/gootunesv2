import { NextResponse } from "next/server";
import { expireStalePendingPayins } from "@/lib/purchases/expire-pending";
import { logServerError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Expire les payins pending > 5 min (achats + abos artiste/label).
 * Planifié une fois par jour à 03:00 UTC (limite du plan Hobby).
 * Auth : Bearer / x-admin-secret = CRON_SECRET (Vercel Cron).
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

    const result = await expireStalePendingPayins();
    return NextResponse.json({
      ok: true,
      ...result,
      total: result.purchases + result.labelPlans + result.artistPlans,
    });
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

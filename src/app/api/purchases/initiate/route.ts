import { NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request-client";
import { runInitiatePurchase } from "@/lib/purchases/payin";
import { logServerError } from "@/lib/errors";
import type { PaymentMethod } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createRequestClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    let body: {
      release_id?: string;
      payment_method?: string;
      phone?: string;
      om_otp?: string;
    } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
    }

    const result = await runInitiatePurchase(supabase, {
      releaseId: String(body.release_id || ""),
      paymentMethod: String(body.payment_method || "") as PaymentMethod,
      phoneRaw: String(body.phone || "").trim(),
      omOtp: String(body.om_otp || "").trim(),
    });

    if (result.error) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (e) {
    logServerError("api.purchases.initiate", e);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'initiation du paiement." },
      { status: 500 },
    );
  }
}

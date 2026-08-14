import { NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request-client";
import { runCheckPurchaseStatus } from "@/lib/purchases/payin";
import { logServerError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createRequestClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = String(searchParams.get("orderId") || "").trim();
    if (!orderId) {
      return NextResponse.json(
        { error: "orderId requis.", status: "unknown" },
        { status: 400 },
      );
    }

    const result = await runCheckPurchaseStatus(supabase, orderId);
    return NextResponse.json(result);
  } catch (e) {
    logServerError("api.purchases.status", e);
    return NextResponse.json(
      { error: "Erreur serveur.", status: "unknown" },
      { status: 500 },
    );
  }
}

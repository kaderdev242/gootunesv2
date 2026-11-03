import { NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfillPurchaseByOrderId } from "@/lib/mbiyo/fulfill";
import { verifyAppleTransactionJws } from "@/lib/purchases/apple-jws";
import {
  APPLE_BUNDLE_ID,
  APPLE_IAP_ARTIST_RATE,
  isKnownAppleSku,
  nearestReleasePriceTier,
} from "@/lib/purchases/apple-tiers";
import { logServerError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Valide un JWS StoreKit 2 et débloque la release (library_items).
 * Body: { releaseId, transactionJws }
 */
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

    let body: { releaseId?: string; transactionJws?: string } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
    }

    const releaseId = String(body.releaseId || "").trim();
    const jws = String(body.transactionJws || "").trim();
    if (!releaseId || !jws) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }

    const tx = await verifyAppleTransactionJws(jws);
    if (!tx) {
      return NextResponse.json(
        { error: "Reçu Apple invalide." },
        { status: 400 },
      );
    }

    const expectedBundle =
      process.env.APPLE_BUNDLE_ID || APPLE_BUNDLE_ID;
    if (tx.bundleId !== expectedBundle) {
      return NextResponse.json({ error: "Bundle Apple invalide." }, { status: 400 });
    }
    if (!isKnownAppleSku(tx.productId)) {
      return NextResponse.json({ error: "Produit Apple inconnu." }, { status: 400 });
    }

    const admin = createAdminClient();
    const select =
      "id, public_id, owner_id, price_fcfa, status, title, is_hidden" as const;
    const byId = await admin
      .from("releases")
      .select(select)
      .eq("id", releaseId)
      .eq("status", "published")
      .eq("is_hidden", false)
      .maybeSingle();
    const release =
      byId.data ??
      (
        await admin
          .from("releases")
          .select(select)
          .eq("public_id", releaseId)
          .eq("status", "published")
          .eq("is_hidden", false)
          .maybeSingle()
      ).data;

    if (!release) {
      return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
    }
    if (release.owner_id === user.id) {
      return NextResponse.json(
        { error: "Tu ne peux pas acheter ta propre publication." },
        { status: 400 },
      );
    }

    const palier = nearestReleasePriceTier(Number(release.price_fcfa) || 0);
    const expectedSku = palier.sku;
    if (tx.productId !== expectedSku) {
      return NextResponse.json(
        { error: "Le palier Apple ne correspond pas à ce titre." },
        { status: 400 },
      );
    }

    const { data: already } = await admin
      .from("library_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("release_id", release.id)
      .maybeSingle();
    if (already) {
      return NextResponse.json({
        success: true,
        alreadyOwned: true,
        releaseId: release.id,
      });
    }

    const existingTx = await admin
      .from("purchases")
      .select("id, status, buyer_id, release_id")
      .eq("order_id", tx.transactionId)
      .maybeSingle();

    if (existingTx.data) {
      if (
        existingTx.data.buyer_id === user.id &&
        existingTx.data.release_id === release.id &&
        existingTx.data.status === "completed"
      ) {
        return NextResponse.json({
          success: true,
          alreadyOwned: true,
          releaseId: release.id,
        });
      }
      return NextResponse.json(
        { error: "Transaction Apple déjà utilisée." },
        { status: 409 },
      );
    }

    const amount = palier.priceFcfa;
    const artistNet = Math.round(amount * APPLE_IAP_ARTIST_RATE);
    const commission = Math.max(0, amount - artistNet);

    const { error: insertError } = await admin.from("purchases").insert({
      buyer_id: user.id,
      seller_id: release.owner_id,
      release_id: release.id,
      amount_fcfa: amount,
      commission_fcfa: commission,
      artist_net_fcfa: artistNet,
      payment_method: "apple",
      status: "pending",
      order_id: tx.transactionId,
      provider: "apple",
      provider_transaction_id: tx.transactionId,
      provider_meta: {
        productId: tx.productId,
        environment: tx.environment || null,
        originalTransactionId: tx.originalTransactionId || null,
        appleFeeRate: 0.3,
        artistRate: APPLE_IAP_ARTIST_RATE,
      },
    });

    if (insertError) {
      logServerError("apple.purchase.insert", insertError);
      return NextResponse.json(
        { error: "Impossible d’enregistrer l’achat." },
        { status: 500 },
      );
    }

    const fulfilled = await fulfillPurchaseByOrderId(tx.transactionId, tx.transactionId, {
      productId: tx.productId,
      environment: tx.environment || null,
    });

    if (!fulfilled.ok) {
      logServerError("apple.purchase.fulfill", fulfilled);
      return NextResponse.json(
        { error: "Achat enregistré mais déblocage incomplet." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      releaseId: release.id,
      already: fulfilled.already === true,
    });
  } catch (e) {
    logServerError("api.purchases.apple.verify", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

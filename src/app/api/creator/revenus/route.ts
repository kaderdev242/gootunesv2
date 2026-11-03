import { NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request-client";
import {
  isCreatorSession,
  publicCreatorProfile,
  requireCreatorApi,
} from "@/lib/creator/require-api";

export const dynamic = "force-dynamic";

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] || null : v;
}

export async function GET(request: Request) {
  const session = await requireCreatorApi(request);
  if (!isCreatorSession(session)) return session;

  const supabase = await createRequestClient(request);
  const { data: purchases } = await supabase
    .from("purchases")
    .select(
      "id, created_at, status, payment_method, artist_net_fcfa, amount_fcfa, releases(title)",
    )
    .eq("seller_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (purchases ?? []).map((p) => {
    const release = one(p.releases as { title: string } | { title: string }[] | null);
    return {
      id: p.id,
      created_at: p.created_at,
      status: p.status,
      payment_method: p.payment_method,
      artist_net_fcfa: Number(p.artist_net_fcfa) || 0,
      amount_fcfa: Number(p.amount_fcfa) || 0,
      title: release?.title || "Achat",
    };
  });

  return NextResponse.json({
    profile: publicCreatorProfile(session.profile),
    rows,
  });
}

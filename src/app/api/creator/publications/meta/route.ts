import { NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request-client";
import { hasActiveArtistPlan } from "@/lib/artist-plan";
import { isCreatorSession, requireCreatorApi } from "@/lib/creator/require-api";
import { MUSIC_GENRES } from "@/lib/genres";
import { RELEASE_PRICE_TIERS } from "@/lib/purchases/apple-tiers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireCreatorApi(request);
  if (!isCreatorSession(session)) return session;

  const supabase = await createRequestClient(request);
  const { data: artists } = await supabase
    .from("artists")
    .select("id, stage_name, avatar_url")
    .or(`owner_id.eq.${session.userId},label_id.eq.${session.userId}`)
    .order("stage_name");

  const canPublish =
    session.profile.role === "label" || hasActiveArtistPlan(session.profile);

  return NextResponse.json({
    artists: (artists ?? []).map((a) => ({
      id: a.id,
      stage_name: a.stage_name,
      avatar_url: a.avatar_url,
    })),
    genres: MUSIC_GENRES,
    price_tiers: RELEASE_PRICE_TIERS.map((t) => ({
      sku: t.sku,
      price_fcfa: t.priceFcfa,
      apple_usd: t.appleUsd,
    })),
    can_publish: canPublish,
    plan_required: !canPublish && session.profile.role === "artist",
  });
}

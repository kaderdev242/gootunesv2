import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasActiveArtistPlan } from "@/lib/artist-plan";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import { logServerError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OwnerRow = {
  id: string;
  onboarding_completed: boolean | null;
  artist_plan: string | null;
  artist_plan_expires_at: string | null;
  label_plan: string | null;
  label_plan_expires_at: string | null;
};

function hasActiveLabelPlan(p: OwnerRow | undefined): boolean {
  if (!p?.label_plan || p.label_plan === "none" || !p.label_plan_expires_at) return false;
  return new Date(p.label_plan_expires_at).getTime() > Date.now();
}

/**
 * Artistes visibles dans Discover (appli mobile) : abonnement artiste
 * ou label actif, inscription terminée et au moins un titre publié.
 * Les profils n'étant plus lisibles côté client, le filtre se fait ici.
 */
export async function GET(request: NextRequest) {
  const ip = clientIpFromHeaders(request.headers);
  const rl = await checkRateLimit(`public:artists:${ip}`, 120, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().slice(0, 80);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 60);
  // `sort=sales` : les plus vendus d'abord (écran de bienvenue de l'app).
  const bySales = searchParams.get("sort") === "sales";
  // `with_avatar=1` : uniquement les artistes qui ont une photo.
  const withAvatar = searchParams.get("with_avatar") === "1";

  try {
    const admin = createAdminClient();

    // 1. Artistes ayant au moins un titre dans une sortie publiée et visible.
    const { data: trackRows, error: tracksError } = await admin
      .from("tracks")
      .select("release_id, releases!inner(artist_id, status, is_hidden)")
      .eq("releases.status", "published")
      .eq("releases.is_hidden", false)
      .limit(5000);
    if (tracksError) throw tracksError;

    const withTracks = new Set<string>();
    for (const row of trackRows || []) {
      const rel = (row as { releases: { artist_id: string } | { artist_id: string }[] }).releases;
      const artistId = Array.isArray(rel) ? rel[0]?.artist_id : rel?.artist_id;
      if (artistId) withTracks.add(artistId);
    }
    if (!withTracks.size) return NextResponse.json({ artists: [] });

    // 2. Fiches artistes (avec recherche éventuelle).
    let artistsQuery = admin
      .from("artists")
      .select("id, public_id, stage_name, avatar_url, country, bio, label_id, is_verified, created_at, owner_id")
      .in("id", [...withTracks])
      .order("created_at", { ascending: false })
      .limit(300);
    if (q) artistsQuery = artistsQuery.ilike("stage_name", `%${q}%`);
    const { data: artists, error: artistsError } = await artistsQuery;
    if (artistsError) throw artistsError;

    // 3. Abonnements des propriétaires et des labels.
    const profileIds = [
      ...new Set(
        (artists || []).flatMap((a) => [a.owner_id, a.label_id].filter(Boolean) as string[]),
      ),
    ];
    const { data: profiles, error: profilesError } = profileIds.length
      ? await admin
          .from("profiles")
          .select("id, onboarding_completed, artist_plan, artist_plan_expires_at, label_plan, label_plan_expires_at")
          .in("id", profileIds)
      : { data: [], error: null };
    if (profilesError) throw profilesError;
    const byId = new Map((profiles as OwnerRow[]).map((p) => [p.id, p]));

    // 4. Ventes réalisées par artiste (tri « les plus vendus »).
    const sales = new Map<string, number>();
    if (bySales) {
      const { data: saleRows, error: salesError } = await admin
        .from("purchases")
        .select("release_id, releases!inner(artist_id)")
        .eq("status", "completed")
        .limit(20000);
      if (salesError) throw salesError;
      for (const row of saleRows || []) {
        const rel = (row as { releases: { artist_id: string } | { artist_id: string }[] }).releases;
        const artistId = Array.isArray(rel) ? rel[0]?.artist_id : rel?.artist_id;
        if (artistId) sales.set(artistId, (sales.get(artistId) ?? 0) + 1);
      }
    }

    const filtered = (artists || []).filter((a) => {
      if (withAvatar && !a.avatar_url) return false;
      const owner = byId.get(a.owner_id);
      if (!owner?.onboarding_completed) return false;
      const label = a.label_id ? byId.get(a.label_id) : undefined;
      return hasActiveArtistPlan(owner) || hasActiveLabelPlan(owner) || hasActiveLabelPlan(label);
    });
    if (bySales) {
      // Ventes décroissantes ; à égalité, le plus récent d'abord (ordre initial).
      filtered.sort((a, b) => (sales.get(b.id) ?? 0) - (sales.get(a.id) ?? 0));
    }

    const visible = filtered
      .slice(0, limit)
      .map((a) => ({
        id: a.id,
        public_id: a.public_id,
        stage_name: a.stage_name,
        avatar_url: a.avatar_url,
        country: a.country,
        bio: a.bio,
        is_verified: a.is_verified,
        created_at: a.created_at,
      }));

    return NextResponse.json(
      { artists: visible },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } },
    );
  } catch (error) {
    logServerError("api.artists", error);
    return NextResponse.json({ error: "Artistes indisponibles." }, { status: 500 });
  }
}

import { createClient } from "@/lib/supabase/server";
import { getCountryLabel } from "@/lib/constants";

export type TopSaleRow = {
  releaseId: string;
  title: string;
  coverUrl: string | null;
  salesCount: number;
  grossFcfa: number;
  netFcfa: number;
};

export type CountryStatRow = {
  country: string;
  label: string;
  purchases: number;
  amountFcfa: number;
};

export type TrackListenRow = {
  trackId: string;
  title: string;
  releaseTitle: string;
  plays: number;
  uniqueListeners: number;
};

export type ArtistRevenueRow = {
  artistId: string;
  stageName: string;
  avatarUrl: string | null;
  salesCount: number;
  grossFcfa: number;
  netFcfa: number;
};

export type CreatorStats = {
  totalSales: number;
  totalGross: number;
  totalNet: number;
  totalPlays: number;
  uniqueListeners: number;
  topSales: TopSaleRow[];
  byCountry: CountryStatRow[];
  topTracks: TrackListenRow[];
  byArtist: ArtistRevenueRow[];
};

export async function getCreatorStats(
  sellerId: string,
  options?: { artistId?: string },
): Promise<CreatorStats> {
  const supabase = await createClient();
  const artistId = options?.artistId;

  let scopedReleaseIds: string[] | null = null;
  if (artistId) {
    const { data: artistReleases } = await supabase
      .from("releases")
      .select("id")
      .eq("owner_id", sellerId)
      .eq("artist_id", artistId);
    scopedReleaseIds = (artistReleases ?? []).map((r) => r.id);
  }

  let purchaseQuery = supabase
    .from("purchases")
    .select("id, amount_fcfa, artist_net_fcfa, release_id, buyer_id")
    .eq("seller_id", sellerId)
    .eq("status", "completed");

  if (scopedReleaseIds) {
    if (scopedReleaseIds.length === 0) {
      return {
        totalSales: 0,
        totalGross: 0,
        totalNet: 0,
        totalPlays: 0,
        uniqueListeners: 0,
        topSales: [],
        byCountry: [],
        topTracks: [],
        byArtist: [],
      };
    }
    purchaseQuery = purchaseQuery.in("release_id", scopedReleaseIds);
  }

  const { data: purchases } = await purchaseQuery;

  const rows = purchases ?? [];
  const releaseIds = [...new Set(rows.map((p) => p.release_id))];
  const buyerIds = [...new Set(rows.map((p) => p.buyer_id))];

  const [{ data: releases }, { data: buyers }] = await Promise.all([
    releaseIds.length
      ? supabase
          .from("releases")
          .select("id, title, cover_url, artist_id")
          .in("id", releaseIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            title: string;
            cover_url: string | null;
            artist_id: string;
          }[],
        }),
    buyerIds.length
      ? supabase.from("profiles").select("id, country").in("id", buyerIds)
      : Promise.resolve({ data: [] as { id: string; country: string | null }[] }),
  ]);

  const releaseMap = new Map((releases ?? []).map((r) => [r.id, r]));
  const buyerMap = new Map((buyers ?? []).map((b) => [b.id, b]));

  const artistIds = [
    ...new Set((releases ?? []).map((r) => r.artist_id).filter(Boolean)),
  ];
  const { data: artists } = artistIds.length
    ? await supabase
        .from("artists")
        .select("id, stage_name, avatar_url")
        .in("id", artistIds)
    : { data: [] as { id: string; stage_name: string; avatar_url: string | null }[] };

  const artistMap = new Map((artists ?? []).map((a) => [a.id, a]));

  const totalGross = rows.reduce((s, p) => s + Number(p.amount_fcfa), 0);
  const totalNet = rows.reduce((s, p) => s + Number(p.artist_net_fcfa), 0);

  const byRelease = new Map<
    string,
    {
      title: string;
      coverUrl: string | null;
      salesCount: number;
      grossFcfa: number;
      netFcfa: number;
    }
  >();

  const byCountry = new Map<string, { purchases: number; amountFcfa: number }>();
  const byArtist = new Map<
    string,
    {
      stageName: string;
      avatarUrl: string | null;
      salesCount: number;
      grossFcfa: number;
      netFcfa: number;
    }
  >();

  for (const p of rows) {
    const release = releaseMap.get(p.release_id);
    const prev = byRelease.get(p.release_id) || {
      title: release?.title || "Sans titre",
      coverUrl: release?.cover_url ?? null,
      salesCount: 0,
      grossFcfa: 0,
      netFcfa: 0,
    };
    prev.salesCount += 1;
    prev.grossFcfa += Number(p.amount_fcfa);
    prev.netFcfa += Number(p.artist_net_fcfa);
    byRelease.set(p.release_id, prev);

    const country = buyerMap.get(p.buyer_id)?.country || "??";
    const cPrev = byCountry.get(country) || { purchases: 0, amountFcfa: 0 };
    cPrev.purchases += 1;
    cPrev.amountFcfa += Number(p.amount_fcfa);
    byCountry.set(country, cPrev);

    if (release?.artist_id) {
      const artist = artistMap.get(release.artist_id);
      const aPrev = byArtist.get(release.artist_id) || {
        stageName: artist?.stage_name || "Artiste",
        avatarUrl: artist?.avatar_url ?? null,
        salesCount: 0,
        grossFcfa: 0,
        netFcfa: 0,
      };
      aPrev.salesCount += 1;
      aPrev.grossFcfa += Number(p.amount_fcfa);
      aPrev.netFcfa += Number(p.artist_net_fcfa);
      byArtist.set(release.artist_id, aPrev);
    }
  }

  const topSales: TopSaleRow[] = [...byRelease.entries()]
    .map(([releaseId, v]) => ({ releaseId, ...v }))
    .sort((a, b) => b.salesCount - a.salesCount || b.grossFcfa - a.grossFcfa)
    .slice(0, 10);

  const countryStats: CountryStatRow[] = [...byCountry.entries()]
    .map(([country, v]) => ({
      country,
      label: country === "??" ? "Inconnu" : getCountryLabel(country),
      ...v,
    }))
    .sort((a, b) => b.purchases - a.purchases || b.amountFcfa - a.amountFcfa);

  const artistStats: ArtistRevenueRow[] = [...byArtist.entries()]
    .map(([artistId, v]) => ({ artistId, ...v }))
    .sort((a, b) => b.netFcfa - a.netFcfa || b.salesCount - a.salesCount);

  let playsQuery = supabase
    .from("track_plays")
    .select("track_id, listener_id, release_id")
    .eq("owner_id", sellerId);

  if (scopedReleaseIds) {
    playsQuery = playsQuery.in("release_id", scopedReleaseIds);
  }

  const { data: plays } = await playsQuery;
  const playRows = plays ?? [];
  const totalPlays = playRows.length;
  const uniqueListeners = new Set(
    playRows.map((p) => p.listener_id).filter(Boolean),
  ).size;

  const trackIds = [...new Set(playRows.map((p) => p.track_id))];
  const playReleaseIds = [...new Set(playRows.map((p) => p.release_id))];

  const [{ data: tracks }, { data: playReleases }] = await Promise.all([
    trackIds.length
      ? supabase.from("tracks").select("id, title").in("id", trackIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    playReleaseIds.length
      ? supabase.from("releases").select("id, title").in("id", playReleaseIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const trackMap = new Map((tracks ?? []).map((t) => [t.id, t]));
  const playReleaseMap = new Map((playReleases ?? []).map((r) => [r.id, r]));

  const byTrack = new Map<
    string,
    {
      title: string;
      releaseTitle: string;
      plays: number;
      listeners: Set<string>;
    }
  >();

  for (const play of playRows) {
    const track = trackMap.get(play.track_id);
    const release = playReleaseMap.get(play.release_id);
    const prev = byTrack.get(play.track_id) || {
      title: track?.title || "Titre",
      releaseTitle: release?.title || "—",
      plays: 0,
      listeners: new Set<string>(),
    };
    prev.plays += 1;
    if (play.listener_id) prev.listeners.add(play.listener_id);
    byTrack.set(play.track_id, prev);
  }

  const topTracks: TrackListenRow[] = [...byTrack.entries()]
    .map(([trackId, v]) => ({
      trackId,
      title: v.title,
      releaseTitle: v.releaseTitle,
      plays: v.plays,
      uniqueListeners: v.listeners.size,
    }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10);

  return {
    totalSales: rows.length,
    totalGross,
    totalNet,
    totalPlays,
    uniqueListeners,
    topSales,
    byCountry: countryStats,
    topTracks,
    byArtist: artistStats,
  };
}

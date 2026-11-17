import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCountryLabel } from "@/lib/constants";
import type { Database } from "@/lib/supabase/database.types";

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

export type BeatStatRow = {
  beatId: string;
  publicId: string;
  title: string;
  coverUrl: string | null;
  plays: number;
  sales: number;
  netFcfa: number;
};

export type ProdsStats = {
  beats: number;
  plays: number;
  sales: number;
  grossFcfa: number;
  netFcfa: number;
  top: BeatStatRow[];
  /** Ventes de licences par pays d'acheteur (fusionnées dans « Pays des achats »). */
  countries: Record<string, { purchases: number; amountFcfa: number }>;
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
  /** Instrumentaux (Prods) : écoutes des démos et licences vendues. */
  prods?: ProdsStats;
};

const EMPTY_PRODS: ProdsStats = { beats: 0, plays: 0, sales: 0, grossFcfa: 0, netFcfa: 0, top: [], countries: {} };

async function getProdsStats(
  supabase: SupabaseClient<Database>,
  sellerId: string,
  artistId?: string,
): Promise<ProdsStats> {
  try {
    let beatsQuery = supabase
      .from("beats")
      .select("id, public_id, title, cover_url, plays_count")
      .eq("owner_id", sellerId);
    if (artistId) beatsQuery = beatsQuery.eq("artist_id", artistId);
    const { data: beats } = await beatsQuery;
    if (!beats?.length) return EMPTY_PRODS;

    const { data: orders } = await supabase
      .from("beat_orders")
      .select("beat_id, amount_fcfa, artist_net_fcfa, buyer_country")
      .eq("seller_id", sellerId)
      .eq("status", "completed")
      .in(
        "beat_id",
        beats.map((b) => b.id),
      );

    const byBeat = new Map<string, { sales: number; net: number }>();
    let gross = 0;
    let net = 0;
    const countries: ProdsStats["countries"] = {};
    for (const o of orders ?? []) {
      const c = o.buyer_country || "??";
      countries[c] = countries[c] ?? { purchases: 0, amountFcfa: 0 };
      countries[c].purchases += 1;
      countries[c].amountFcfa += Number(o.amount_fcfa);
      const cur = byBeat.get(o.beat_id) ?? { sales: 0, net: 0 };
      cur.sales += 1;
      cur.net += Number(o.artist_net_fcfa);
      byBeat.set(o.beat_id, cur);
      gross += Number(o.amount_fcfa);
      net += Number(o.artist_net_fcfa);
    }

    const top = beats
      .map((b) => ({
        beatId: b.id,
        publicId: b.public_id,
        title: b.title,
        coverUrl: b.cover_url,
        plays: b.plays_count,
        sales: byBeat.get(b.id)?.sales ?? 0,
        netFcfa: byBeat.get(b.id)?.net ?? 0,
      }))
      .sort((a, b) => b.sales - a.sales || b.plays - a.plays)
      .slice(0, 10);

    return {
      beats: beats.length,
      plays: beats.reduce((s, b) => s + b.plays_count, 0),
      sales: orders?.length ?? 0,
      grossFcfa: gross,
      netFcfa: net,
      top,
      countries,
    };
  } catch {
    // Tables Prods absentes : section masquée.
    return EMPTY_PRODS;
  }
}

export async function getCreatorStats(
  sellerId: string,
  options?: { artistId?: string; client?: SupabaseClient<Database> },
): Promise<CreatorStats> {
  const supabase = options?.client ?? (await createClient());
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
    .select("id, amount_fcfa, artist_net_fcfa, release_id, buyer_country")
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
        prods: await getProdsStats(supabase, sellerId, artistId),
      };
    }
    purchaseQuery = purchaseQuery.in("release_id", scopedReleaseIds);
  }

  const { data: purchases } = await purchaseQuery;

  const rows = purchases ?? [];
  const releaseIds = [...new Set(rows.map((p) => p.release_id))];

  // Le pays de l'acheteur est figé dans la vente (migration 031) : un créateur ne peut pas lire le profil de ses acheteurs.
  const { data: releases } = releaseIds.length
    ? await supabase.from("releases").select("id, title, cover_url, artist_id").in("id", releaseIds)
    : { data: [] as { id: string; title: string; cover_url: string | null; artist_id: string }[] };

  const releaseMap = new Map((releases ?? []).map((r) => [r.id, r]));

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

    const country = p.buyer_country || "??";
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

  const prods = await getProdsStats(supabase, sellerId, artistId);
  for (const [c, v] of Object.entries(prods.countries)) {
    const cur = byCountry.get(c) || { purchases: 0, amountFcfa: 0 };
    cur.purchases += v.purchases;
    cur.amountFcfa += v.amountFcfa;
    byCountry.set(c, cur);
  }

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
    prods,
  };
}

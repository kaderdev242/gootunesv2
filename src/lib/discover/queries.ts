import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/format";
import { isUuid } from "@/lib/public-id";
import type { Album, Artist, RecentPlay, Track } from "@/lib/types/music";
import { FALLBACK_COVER, trackStreamUrl } from "@/lib/types/music";

type ReleaseCredits = {
  auteur?: string | null;
  compositeur?: string | null;
  producteur?: string | null;
};

type ReleaseRow = {
  id: string;
  public_id: string;
  title: string;
  cover_url: string | null;
  price_fcfa: number;
  genre: string | null;
  type: "single" | "album";
  created_at: string;
  artist_id: string;
  owner_id: string;
  featuring: string | null;
  credits: ReleaseCredits | null;
  artists: {
    id: string;
    public_id: string;
    stage_name: string;
    avatar_url: string | null;
    country: string | null;
    bio: string | null;
  } | null;
  tracks: {
    id: string;
    title: string;
    audio_url: string | null;
    track_number: number;
    duration_seconds: number | null;
    is_explicit?: boolean;
  }[];
};

function asArtist(rel: ReleaseRow["artists"]) {
  return {
    id: rel?.public_id || rel?.id || "",
    uuid: rel?.id || "",
    name: rel?.stage_name || "Artiste",
    avatar: rel?.avatar_url || FALLBACK_COVER,
    country: rel?.country || "",
  };
}

export function releaseToTrack(release: ReleaseRow, track?: ReleaseRow["tracks"][number]): Track {
  const t =
    track ||
    [...(release.tracks || [])].sort((a, b) => a.track_number - b.track_number)[0];
  const artist = asArtist(release.artists);
  const seconds =
    t?.duration_seconds && t.duration_seconds > 0 ? t.duration_seconds : 0;

  return {
    id: t?.id || release.id,
    releaseId: release.id,
    releasePublicId: release.public_id,
    artistId: artist.uuid || release.artist_id,
    artistPublicId: artist.id,
    ownerId: release.owner_id,
    title: t?.title || release.title,
    artist: artist.name,
    album: release.title,
    cover: release.cover_url || FALLBACK_COVER,
    duration: formatDuration(seconds),
    durationSeconds: seconds,
    genre: release.genre || "—",
    price: Number(release.price_fcfa),
    // Jamais l'URL R2 publique côté client — uniquement le proxy sécurisé
    audioUrl: t?.id ? trackStreamUrl(t.id) : null,
    explicit: Boolean(t?.is_explicit),
  };
}

export function releaseToAlbum(release: ReleaseRow): Album {
  const artist = asArtist(release.artists);
  return {
    id: release.public_id,
    uuid: release.id,
    title: release.title,
    artist: artist.name,
    artistId: artist.id || release.artist_id,
    cover: release.cover_url || FALLBACK_COVER,
    year: new Date(release.created_at).getFullYear(),
    tracksCount: release.tracks?.length || 0,
    price: Number(release.price_fcfa),
    explicit: (release.tracks || []).some((t) => t.is_explicit),
  };
}

const RELEASE_SELECT = `
  id, public_id, title, cover_url, price_fcfa, genre, type, created_at, artist_id, owner_id, featuring, credits,
  artists(id, public_id, stage_name, avatar_url, country, bio),
  tracks(id, title, audio_url, track_number, duration_seconds, is_explicit)
`;

function parseCredits(raw: unknown): ReleaseCredits | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const c = raw as Record<string, unknown>;
  return {
    auteur: typeof c.auteur === "string" ? c.auteur : null,
    compositeur: typeof c.compositeur === "string" ? c.compositeur : null,
    producteur: typeof c.producteur === "string" ? c.producteur : null,
  };
}

function normalizeRelease(row: ReleaseRow): ReleaseRow {
  const artists = Array.isArray(row.artists)
    ? row.artists[0] || null
    : row.artists;
  const tracks = Array.isArray(row.tracks) ? row.tracks : [];
  return {
    ...row,
    artists,
    tracks,
    featuring: row.featuring || null,
    credits: parseCredits(row.credits),
  };
}

async function fetchPublishedReleases(limit = 40) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [] as ReleaseRow[];
  const supabase = await createClient();
  const { data } = await supabase
    .from("releases")
    .select(RELEASE_SELECT)
    .eq("status", "published")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data as unknown as ReleaseRow[]) || []).map(normalizeRelease);
}

/** Sorties récentes : dernières publications */
export async function getRecentTracks(limit = 8): Promise<Track[]> {
  const releases = await fetchPublishedReleases(limit);
  return releases.map((r) => releaseToTrack(r));
}

/** Hits éditoriaux publiés par l'admin (ordre `position`). */
export async function getEditorialHits(limit = 24): Promise<Track[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const { data: hits, error } = await supabase
    .from("editorial_hits")
    .select("track_id, release_id, title, cover_url, position")
    .eq("is_published", true)
    .order("position", { ascending: true })
    .limit(limit);

  if (error || !hits?.length) return [];

  const releaseIds = [...new Set(hits.map((h) => h.release_id))];
  const { data: releases } = await supabase
    .from("releases")
    .select(RELEASE_SELECT)
    .in("id", releaseIds)
    .eq("status", "published")
    .eq("is_hidden", false);

  const byId = new Map(
    ((releases as unknown as ReleaseRow[]) || [])
      .map(normalizeRelease)
      .map((r) => [r.id, r] as const),
  );

  const tracks: Track[] = [];
  for (const hit of hits) {
    const release = byId.get(hit.release_id);
    if (!release) continue;
    const track = release.tracks.find((t) => t.id === hit.track_id);
    if (!track) continue;
    const mapped = releaseToTrack(release, track);
    if (hit.cover_url) mapped.cover = hit.cover_url;
    if (hit.title?.trim()) mapped.title = hit.title.trim();
    tracks.push(mapped);
  }
  return tracks;
}

async function getEngagementScores(
  days: number,
  purchaseWeight = 3,
  playWeight = 1,
) {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase.rpc("get_release_engagement", {
    since_ts: since.toISOString(),
    purchase_weight: purchaseWeight,
    play_weight: playWeight,
  });

  if (error || !data) return new Map<string, number>();
  return new Map(
    (data as { release_id: string; score: number }[]).map((row) => [
      row.release_id,
      Number(row.score) || 0,
    ]),
  );
}

/**
 * Tendances : score = ventes (×3) + écoutes sur 14 jours
 */
export async function getTrendingTracks(limit = 10): Promise<Track[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const [scores, releases] = await Promise.all([
    getEngagementScores(14, 3, 1),
    fetchPublishedReleases(60),
  ]);

  const ranked = [...releases]
    .map((r) => ({
      release: r,
      score: scores.get(r.id) || 0,
      age: new Date(r.created_at).getTime(),
    }))
    .sort((a, b) => b.score - a.score || b.age - a.age)
    .slice(0, limit);

  return ranked.map((r) => releaseToTrack(r.release));
}

/** Albums à la une : albums publiés, priorisés par engagement puis récence */
export async function getFeaturedAlbums(limit = 10): Promise<Album[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const [scores, all] = await Promise.all([
    getEngagementScores(90, 4, 1),
    fetchPublishedReleases(80),
  ]);
  const releases = all.filter((r) => r.type === "album");
  return releases
    .map((r) => ({ release: r, score: scores.get(r.id) || 0 }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.release.created_at).getTime() -
          new Date(a.release.created_at).getTime(),
    )
    .slice(0, limit)
    .map((r) => releaseToAlbum(r.release));
}

/**
 * Recommandés : genres du profil fan, sinon tendances
 */
export async function getRecommendedTracks(
  userId?: string | null,
  limit = 8,
): Promise<Track[]> {
  const releases = await fetchPublishedReleases(60);
  if (!releases.length) return [];

  if (userId) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("genres")
      .eq("id", userId)
      .maybeSingle();

    const genres = new Set((profile?.genres || []).map((g) => g.toLowerCase()));
    if (genres.size) {
      const matched = releases.filter(
        (r) => r.genre && genres.has(r.genre.toLowerCase()),
      );
      if (matched.length) {
        return matched.slice(0, limit).map((r) => releaseToTrack(r));
      }
    }
  }

  return getTrendingTracks(limit);
}

/** Top 5 de la semaine : ventes + écoutes sur 7 jours */
export async function getWeeklyTop(limit = 5): Promise<Track[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const [scores, releases] = await Promise.all([
    getEngagementScores(7, 5, 1),
    fetchPublishedReleases(80),
  ]);

  const ranked = [...releases]
    .map((r) => ({
      release: r,
      score: scores.get(r.id) || 0,
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (!ranked.length) {
    return releases.slice(0, limit).map((r) => releaseToTrack(r));
  }

  return ranked.map((r) => releaseToTrack(r.release));
}

/** Artistes en vogue : plus de ventes / écoutes récentes */
export async function getRisingArtists(limit = 10): Promise<Artist[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const [scores, releases] = await Promise.all([
    getEngagementScores(30, 3, 1),
    fetchPublishedReleases(100),
  ]);

  const artistScores = new Map<string, number>();
  for (const r of releases) {
    const s = scores.get(r.id) || 0;
    if (!s) continue;
    artistScores.set(r.artist_id, (artistScores.get(r.artist_id) || 0) + s);
  }

  const artistIds = [...artistScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, limit);

  if (artistIds.length < limit) {
    for (const r of releases) {
      if (!artistIds.includes(r.artist_id)) artistIds.push(r.artist_id);
      if (artistIds.length >= limit) break;
    }
  }

  if (!artistIds.length) return [];

  const { data: artists } = await supabase
    .from("artists")
    .select("id, public_id, stage_name, avatar_url, country, bio")
    .in("id", artistIds);

  const genreByArtist = new Map<string, string>();
  for (const r of releases) {
    if (r.genre && !genreByArtist.has(r.artist_id)) {
      genreByArtist.set(r.artist_id, r.genre);
    }
  }

  const order = new Map(artistIds.map((id, i) => [id, i]));
  return ((artists || []) as {
    id: string;
    public_id: string;
    stage_name: string;
    avatar_url: string | null;
    country: string | null;
  }[])
    .map((a) => ({
      id: a.public_id,
      uuid: a.id,
      name: a.stage_name,
      avatar: a.avatar_url || FALLBACK_COVER,
      genre: genreByArtist.get(a.id) || "—",
      country: a.country || "",
    }))
    .sort(
      (a, b) =>
        (order.get(a.uuid || "") ?? 99) - (order.get(b.uuid || "") ?? 99),
    );
}

export async function getReleaseById(idOrPublicId: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const key = idOrPublicId.trim();
  if (!key) return null;
  const supabase = await createClient();
  let query = supabase
    .from("releases")
    .select(RELEASE_SELECT)
    .eq("status", "published")
    .eq("is_hidden", false);

  query = isUuid(key) ? query.eq("id", key) : query.eq("public_id", key);

  const { data } = await query.maybeSingle();
  if (!data) return null;
  return normalizeRelease(data as unknown as ReleaseRow);
}

export async function getArtistById(idOrPublicId: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const key = idOrPublicId.trim();
  if (!key) return null;
  const supabase = await createClient();
  let artistQuery = supabase
    .from("artists")
    .select("id, public_id, stage_name, avatar_url, country, bio, label_id, owner_id");

  artistQuery = isUuid(key)
    ? artistQuery.eq("id", key)
    : artistQuery.eq("public_id", key);

  const { data: artist } = await artistQuery.maybeSingle();

  if (!artist) return null;

  const { data: releases } = await supabase
    .from("releases")
    .select(RELEASE_SELECT)
    .eq("artist_id", artist.id)
    .eq("status", "published")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });

  const normalized = ((releases as unknown as ReleaseRow[]) || []).map(
    normalizeRelease,
  );

  const scores = await getEngagementScores(365, 0, 1);
  const listenCount = normalized.reduce(
    (sum, r) => sum + (scores.get(r.id) || 0),
    0,
  );

  return {
    artist,
    releases: normalized,
    listenCount,
  };
}

/** Historique d'écoute du fan connecté (dédupliqué par piste). */
export async function getRecentlyPlayed(
  userId: string,
  limit = 12,
): Promise<RecentPlay[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("track_plays")
    .select(
      `
      id, created_at, track_id, release_id,
      tracks(id, title, audio_url, duration_seconds, track_number, is_explicit),
      releases(id, public_id, title, cover_url, price_fcfa, genre, type, created_at, artist_id, owner_id, artists(id, public_id, stage_name, avatar_url, country, bio))
    `,
    )
    .eq("listener_id", userId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error || !data?.length) return [];

  const seen = new Set<string>();
  const items: RecentPlay[] = [];

  for (const row of data) {
    const trackId = row.track_id as string;
    if (seen.has(trackId)) continue;
    seen.add(trackId);

    const releaseRaw = row.releases as unknown as ReleaseRow | ReleaseRow[] | null;
    const release = Array.isArray(releaseRaw)
      ? releaseRaw[0]
      : releaseRaw;
    if (!release) continue;

    const trackRaw = row.tracks as unknown as
      | ReleaseRow["tracks"][number]
      | ReleaseRow["tracks"]
      | null;
    const trackRow = Array.isArray(trackRaw) ? trackRaw[0] : trackRaw;

    const normalized = normalizeRelease({
      ...release,
      tracks: trackRow ? [trackRow] : release.tracks || [],
    });

    items.push({
      id: row.id as string,
      playedAt: row.created_at as string,
      track: releaseToTrack(normalized, trackRow || undefined),
    });

    if (items.length >= limit) break;
  }

  return items;
}

/** Catalogue / recherche pour les pages Discover */
export async function getCatalogReleases(options?: {
  limit?: number;
  genre?: string | null;
  query?: string | null;
}) {
  const limit = options?.limit ?? 48;
  const releases = await fetchPublishedReleases(Math.max(limit, 80));
  const genre = options?.genre?.trim().toLowerCase();
  const q = options?.query?.trim().toLowerCase();

  return releases
    .filter((r) => {
      if (genre && (r.genre || "").toLowerCase() !== genre) return false;
      if (!q) return true;
      const hay = `${r.title} ${r.artists?.stage_name || ""} ${r.genre || ""}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, limit)
    .map((r) => ({
      id: r.public_id,
      uuid: r.id,
      title: r.title,
      cover_url: r.cover_url,
      genre: r.genre,
      price_fcfa: Number(r.price_fcfa),
      type: r.type,
      artistName: r.artists?.stage_name || "Artiste",
      artistPublicId: r.artists?.public_id || "",
      created_at: r.created_at,
      explicit: (r.tracks || []).some((t) => t.is_explicit),
    }));
}

export type SearchHitRelease = {
  /** public_id (URL) */
  id: string;
  uuid: string;
  title: string;
  cover_url: string | null;
  genre: string | null;
  type: "single" | "album";
  price_fcfa: number;
  artistName: string;
  artistId: string;
  explicit?: boolean;
};

export type SearchHitArtist = {
  /** public_id (URL) */
  id: string;
  uuid: string;
  name: string;
  avatar_url: string | null;
  country: string | null;
};

export type SearchHitTrack = {
  id: string;
  title: string;
  releaseId: string;
  releasePublicId: string;
  releaseTitle: string;
  cover_url: string | null;
  artistName: string;
  explicit?: boolean;
};

/** Recherche catalogue (releases, artistes, titres) */
export async function searchDiscover(
  query: string,
  limit = 12,
): Promise<{
  releases: SearchHitRelease[];
  artists: SearchHitArtist[];
  tracks: SearchHitTrack[];
}> {
  const q = query.trim();
  if (!q || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { releases: [], artists: [], tracks: [] };
  }

  const supabase = await createClient();
  const pattern = `%${q}%`;

  const [byTitle, byArtistName, byTrack, artistsRes] = await Promise.all([
    supabase
      .from("releases")
      .select(RELEASE_SELECT)
      .eq("status", "published")
      .eq("is_hidden", false)
      .ilike("title", pattern)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("artists")
      .select("id")
      .ilike("stage_name", pattern)
      .limit(20),
    supabase
      .from("tracks")
      .select(
        `
        id, title, release_id, is_explicit,
        releases!inner(
          id, public_id, title, cover_url, price_fcfa, genre, type, status, is_hidden, created_at, artist_id, owner_id,
          artists(id, public_id, stage_name, avatar_url, country, bio)
        )
      `,
      )
      .ilike("title", pattern)
      .limit(limit),
    supabase
      .from("artists")
      .select("id, public_id, stage_name, avatar_url, country")
      .ilike("stage_name", pattern)
      .limit(limit),
  ]);

  const artistIds = (byArtistName.data || []).map((a) => a.id);
  let byArtistReleases: ReleaseRow[] = [];
  if (artistIds.length) {
    const { data } = await supabase
      .from("releases")
      .select(RELEASE_SELECT)
      .eq("status", "published")
      .eq("is_hidden", false)
      .in("artist_id", artistIds)
      .order("created_at", { ascending: false })
      .limit(limit);
    byArtistReleases = ((data as unknown as ReleaseRow[]) || []).map(
      normalizeRelease,
    );
  }

  const releaseMap = new Map<string, SearchHitRelease>();
  for (const row of [
    ...((byTitle.data as unknown as ReleaseRow[]) || []).map(normalizeRelease),
    ...byArtistReleases,
  ]) {
    if (releaseMap.has(row.id)) continue;
    releaseMap.set(row.id, {
      id: row.public_id,
      uuid: row.id,
      title: row.title,
      cover_url: row.cover_url,
      genre: row.genre,
      type: row.type,
      price_fcfa: Number(row.price_fcfa),
      artistName: row.artists?.stage_name || "Artiste",
      artistId: row.artists?.public_id || row.artists?.id || row.artist_id,
      explicit: (row.tracks || []).some((t) => t.is_explicit),
    });
  }

  const tracks: SearchHitTrack[] = [];
  for (const row of byTrack.data || []) {
    const releaseRaw = row.releases as unknown as
      | {
          id: string;
          public_id: string;
          title: string;
          cover_url: string | null;
          status: string;
          is_hidden: boolean;
          artists:
            | { stage_name: string }
            | { stage_name: string }[]
            | null;
        }
      | {
          id: string;
          public_id: string;
          title: string;
          cover_url: string | null;
          status: string;
          is_hidden: boolean;
          artists:
            | { stage_name: string }
            | { stage_name: string }[]
            | null;
        }[]
      | null;
    const release = Array.isArray(releaseRaw) ? releaseRaw[0] : releaseRaw;
    if (!release || release.status !== "published" || release.is_hidden) {
      continue;
    }
    const artist = Array.isArray(release.artists)
      ? release.artists[0]
      : release.artists;
    tracks.push({
      id: row.id,
      title: row.title,
      releaseId: release.id,
      releasePublicId: release.public_id,
      releaseTitle: release.title,
      cover_url: release.cover_url,
      artistName: artist?.stage_name || "Artiste",
      explicit: Boolean(
        (row as { is_explicit?: boolean }).is_explicit,
      ),
    });
  }

  return {
    releases: [...releaseMap.values()].slice(0, limit),
    artists: (artistsRes.data || []).map((a) => ({
      id: a.public_id,
      uuid: a.id,
      name: a.stage_name,
      avatar_url: a.avatar_url,
      country: a.country,
    })),
    tracks: tracks.slice(0, limit),
  };
}

export async function getGenreCounts() {
  const releases = await fetchPublishedReleases(200);
  const counts = new Map<string, number>();
  for (const r of releases) {
    const g = r.genre?.trim();
    if (!g) continue;
    counts.set(g, (counts.get(g) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre));
}

export type { ReleaseRow };

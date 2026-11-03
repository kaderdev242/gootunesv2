import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FALLBACK_COVER, trackStreamUrl, type Track } from "@/lib/types/music";
import { formatDuration } from "@/lib/format";

export type PlaylistSummary = {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  tracksCount: number;
  savesCount?: number;
  ownerName?: string;
};

export type PlaylistDetail = PlaylistSummary & {
  tracks: Track[];
  user_id: string;
  isOwner: boolean;
  isSaved: boolean;
  savesCount: number;
};

function mapSummary(p: {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
  playlist_tracks?: { count: number }[] | null;
  playlist_saves?: { count: number }[] | null;
  profiles?:
    | { display_name: string | null }
    | { display_name: string | null }[]
    | null;
}): PlaylistSummary {
  const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
  return {
    id: p.id,
    title: p.title,
    description: p.description || "",
    cover_url: p.cover_url,
    is_public: Boolean(p.is_public),
    created_at: p.created_at,
    updated_at: p.updated_at,
    tracksCount: p.playlist_tracks?.[0]?.count || 0,
    savesCount: p.playlist_saves?.[0]?.count || 0,
    ownerName: profile?.display_name || undefined,
  };
}

export async function getUserPlaylists(
  userId: string,
  limit = 50,
): Promise<PlaylistSummary[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !userId) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("playlists")
    .select(
      "id, title, description, cover_url, is_public, created_at, updated_at, playlist_tracks(count)",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return ((data || []) as Parameters<typeof mapSummary>[0][]).map(mapSummary);
}

export async function getRecentPlaylists(
  userId: string,
  limit = 3,
): Promise<PlaylistSummary[]> {
  return getUserPlaylists(userId, limit);
}

/** Playlists publiques pour Discover (Home + évent. page list). */
export async function getPublicPlaylists(
  limit = 12,
): Promise<PlaylistSummary[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  // Clé de service : le nom de l'auteur vient de « profiles », lisible
  // uniquement par son propriétaire. Filtré sur les playlists publiques.
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("playlists")
    .select(
      "id, title, description, cover_url, is_public, created_at, updated_at, playlist_tracks(count), playlist_saves(count), profiles!playlists_user_id_fkey(display_name)",
    )
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return ((data || []) as Parameters<typeof mapSummary>[0][]).map(mapSummary);
}

export async function getPlaylistById(
  playlistId: string,
  viewerId?: string | null,
): Promise<PlaylistDetail | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !playlistId) return null;

  const supabase = await createClient();
  const { data: playlist } = await supabase
    .from("playlists")
    .select(
      "id, user_id, title, description, cover_url, is_public, created_at, updated_at",
    )
    .eq("id", playlistId)
    .maybeSingle();

  if (!playlist) return null;

  const isOwner = Boolean(viewerId && playlist.user_id === viewerId);
  if (!playlist.is_public && !isOwner) return null;

  const [{ data: rows }, { count: savesCount }, savedRow] = await Promise.all([
    supabase
      .from("playlist_tracks")
      .select(
        `
      id, position, added_at, track_id,
      tracks(
        id, title, audio_url, track_number, duration_seconds, is_explicit, release_id,
        releases(
          id, public_id, title, cover_url, price_fcfa, genre, type, created_at, artist_id, owner_id,
          artists(id, public_id, stage_name, avatar_url, country, bio)
        )
      )
    `,
      )
      .eq("playlist_id", playlistId)
      .order("position", { ascending: true }),
    supabase
      .from("playlist_saves")
      .select("id", { count: "exact", head: true })
      .eq("playlist_id", playlistId),
    viewerId && !isOwner
      ? supabase
          .from("playlist_saves")
          .select("id")
          .eq("playlist_id", playlistId)
          .eq("user_id", viewerId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const tracks: Track[] = [];
  for (const row of rows || []) {
    const nested = row.tracks as unknown;
    const trackRaw = (Array.isArray(nested) ? nested[0] : nested) as {
      id: string;
      title: string;
      audio_url: string | null;
      track_number: number;
      duration_seconds: number | null;
      is_explicit?: boolean;
      release_id: string;
      releases:
        | {
            id: string;
            public_id: string;
            title: string;
            cover_url: string | null;
            price_fcfa: number;
            genre: string | null;
            artist_id: string;
            owner_id: string;
            artists:
              | {
                  id: string;
                  public_id?: string;
                  stage_name: string;
                  avatar_url: string | null;
                }
              | {
                  id: string;
                  public_id?: string;
                  stage_name: string;
                  avatar_url: string | null;
                }[]
              | null;
          }
        | null
        | Array<{
            id: string;
            public_id: string;
            title: string;
            cover_url: string | null;
            price_fcfa: number;
            genre: string | null;
            artist_id: string;
            owner_id: string;
            artists:
              | {
                  id: string;
                  public_id?: string;
                  stage_name: string;
                  avatar_url: string | null;
                }
              | {
                  id: string;
                  public_id?: string;
                  stage_name: string;
                  avatar_url: string | null;
                }[]
              | null;
          }>;
    } | null;

    if (!trackRaw?.id) continue;
    const release = Array.isArray(trackRaw.releases)
      ? trackRaw.releases[0]
      : trackRaw.releases;
    if (!release) continue;
    const artist = Array.isArray(release.artists)
      ? release.artists[0]
      : release.artists;
    const seconds =
      trackRaw.duration_seconds && trackRaw.duration_seconds > 0
        ? trackRaw.duration_seconds
        : 0;

    tracks.push({
      id: trackRaw.id,
      releaseId: release.id,
      releasePublicId: release.public_id,
      artistId: artist?.id || release.artist_id,
      artistPublicId: artist?.public_id || artist?.id,
      ownerId: release.owner_id,
      title: trackRaw.title,
      artist: artist?.stage_name || "Artiste",
      album: release.title,
      cover: release.cover_url || FALLBACK_COVER,
      duration: formatDuration(seconds),
      durationSeconds: seconds,
      genre: release.genre || "—",
      price: Number(release.price_fcfa),
      audioUrl: trackStreamUrl(trackRaw.id),
      explicit: Boolean(trackRaw.is_explicit),
    });
  }

  if (viewerId) {
    const releaseIds = [
      ...new Set(
        tracks
          .map((track) => track.releaseId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (releaseIds.length > 0) {
      const { data: ownedRows } = await supabase
        .from("library_items")
        .select("release_id")
        .eq("user_id", viewerId)
        .in("release_id", releaseIds);
      const owned = new Set((ownedRows || []).map((row) => row.release_id));
      for (const track of tracks) {
        track.owned = Boolean(track.releaseId && owned.has(track.releaseId));
      }
    }
  }

  return {
    id: playlist.id,
    user_id: playlist.user_id,
    title: playlist.title,
    description: playlist.description || "",
    cover_url: playlist.cover_url,
    is_public: Boolean(playlist.is_public),
    created_at: playlist.created_at,
    updated_at: playlist.updated_at,
    tracksCount: tracks.length,
    tracks,
    isOwner,
    isSaved: Boolean(savedRow.data),
    savesCount: savesCount || 0,
  };
}

import { createClient } from "@/lib/supabase/server";
import { FALLBACK_COVER, trackStreamUrl, type Track } from "@/lib/types/music";
import { formatDuration } from "@/lib/format";

export type PlaylistSummary = {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
  tracksCount: number;
};

export type PlaylistDetail = PlaylistSummary & {
  tracks: Track[];
};

export async function getUserPlaylists(
  userId: string,
  limit = 50,
): Promise<PlaylistSummary[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !userId) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("playlists")
    .select("id, title, description, cover_url, created_at, updated_at, playlist_tracks(count)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return ((data || []) as Array<{
    id: string;
    title: string;
    description: string;
    cover_url: string | null;
    created_at: string;
    updated_at: string;
    playlist_tracks: { count: number }[] | null;
  }>).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description || "",
    cover_url: p.cover_url,
    created_at: p.created_at,
    updated_at: p.updated_at,
    tracksCount: p.playlist_tracks?.[0]?.count || 0,
  }));
}

export async function getRecentPlaylists(
  userId: string,
  limit = 3,
): Promise<PlaylistSummary[]> {
  return getUserPlaylists(userId, limit);
}

export async function getPlaylistById(
  playlistId: string,
  userId: string,
): Promise<PlaylistDetail | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !userId) return null;

  const supabase = await createClient();
  const { data: playlist } = await supabase
    .from("playlists")
    .select("id, title, description, cover_url, created_at, updated_at")
    .eq("id", playlistId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!playlist) return null;

  const { data: rows } = await supabase
    .from("playlist_tracks")
    .select(
      `
      id, position, added_at, track_id,
      tracks(
        id, title, audio_url, track_number, duration_seconds, release_id,
        releases(
          id, title, cover_url, price_fcfa, genre, type, created_at, artist_id, owner_id,
          artists(id, stage_name, avatar_url, country, bio)
        )
      )
    `,
    )
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true });

  const tracks: Track[] = [];
  for (const row of rows || []) {
    const trackRaw = row.tracks as unknown as {
      id: string;
      title: string;
      audio_url: string | null;
      track_number: number;
      duration_seconds: number | null;
      release_id: string;
      releases:
        | {
            id: string;
            title: string;
            cover_url: string | null;
            price_fcfa: number;
            genre: string | null;
            artist_id: string;
            owner_id: string;
            artists:
              | { id: string; stage_name: string; avatar_url: string | null }
              | { id: string; stage_name: string; avatar_url: string | null }[]
              | null;
          }
        | null
        | Array<{
            id: string;
            title: string;
            cover_url: string | null;
            price_fcfa: number;
            genre: string | null;
            artist_id: string;
            owner_id: string;
            artists:
              | { id: string; stage_name: string; avatar_url: string | null }
              | { id: string; stage_name: string; avatar_url: string | null }[]
              | null;
          }>;
    } | null;

    if (!trackRaw) continue;
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
      artistId: artist?.id || release.artist_id,
      ownerId: release.owner_id,
      title: trackRaw.title,
      artist: artist?.stage_name || "Artiste",
      album: release.title,
      cover: release.cover_url || FALLBACK_COVER,
      duration: formatDuration(seconds),
      durationSeconds: seconds || 180,
      genre: release.genre || "—",
      price: Number(release.price_fcfa),
      audioUrl: trackStreamUrl(trackRaw.id),
    });
  }

  return {
    id: playlist.id,
    title: playlist.title,
    description: playlist.description || "",
    cover_url: playlist.cover_url,
    created_at: playlist.created_at,
    updated_at: playlist.updated_at,
    tracksCount: tracks.length,
    tracks,
  };
}

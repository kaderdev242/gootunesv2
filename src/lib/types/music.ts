export type Track = {
  id: string;
  releaseId?: string;
  /** Id court pour les URLs Discover */
  releasePublicId?: string;
  artistId?: string;
  artistPublicId?: string;
  ownerId?: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration: string;
  durationSeconds: number;
  genre: string;
  price: number;
  /** Ne jamais exposer l'URL R2 publique — utiliser /api/stream/:id */
  audioUrl?: string | null;
  liked?: boolean;
  owned?: boolean;
};

export type RecentPlay = {
  id: string;
  playedAt: string;
  track: Track;
};

export type DiscoverPlaylist = {
  id: string;
  title: string;
  tracksCount: number;
  cover: string;
  accent: string;
  pattern: "dots" | "waves" | "rings";
};

export type Artist = {
  /** public_id court (URL) */
  id: string;
  uuid?: string;
  name: string;
  avatar: string;
  genre: string;
  country: string;
};

export type Album = {
  /** public_id court (URL) */
  id: string;
  uuid?: string;
  title: string;
  artist: string;
  artistId?: string;
  cover: string;
  year: number;
  tracksCount: number;
  price?: number;
};

export type Playlist = {
  id: string;
  name: string;
};

export type FriendActivity = {
  id: string;
  name: string;
  avatar: string;
  trackTitle: string;
  artist: string;
  when: string;
};

export type UserProfile = {
  name: string;
  avatar: string;
};

export const FALLBACK_COVER = "/icon-gootunes.png";

export function trackStreamUrl(trackId: string) {
  return `/api/stream/${trackId}`;
}

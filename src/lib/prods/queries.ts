import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const BEAT_PUBLIC_SELECT =
  "id, public_id, title, cover_url, genre, mood, bpm, musical_key, tags, duration_seconds, price_mp3_fcfa, price_wav_fcfa, price_stems_fcfa, plays_count, waveform, created_at, owner_id, credits, artists(id, public_id, stage_name, avatar_url, country, is_verified)" as const;

export type BeatArtist = {
  id: string;
  public_id: string;
  stage_name: string;
  avatar_url: string | null;
  country: string | null;
  is_verified: boolean;
};

export type PublicBeat = {
  id: string;
  public_id: string;
  title: string;
  cover_url: string | null;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  musical_key: string | null;
  tags: string[];
  duration_seconds: number | null;
  price_mp3_fcfa: number | null;
  price_wav_fcfa: number | null;
  price_stems_fcfa: number | null;
  plays_count: number;
  waveform: number[] | null;
  created_at: string;
  owner_id: string;
  credits: unknown;
  artists: BeatArtist | null;
};

export type BeatFilters = {
  q?: string;
  genre?: string;
  mood?: string;
  key?: string;
  bpm?: "lent" | "moyen" | "rapide";
  tri?: "recent" | "populaire" | "prix";
};

const BPM_RANGES = {
  lent: [40, 89],
  moyen: [90, 119],
  rapide: [120, 300],
} as const;

function normalize(row: unknown): PublicBeat {
  const r = row as PublicBeat & { artists: BeatArtist | BeatArtist[] | null };
  return { ...r, artists: Array.isArray(r.artists) ? (r.artists[0] ?? null) : r.artists };
}

/** Catalogue public (RLS : publiées, visibles, beatmaker non suspendu). */
export async function listBeats(filters: BeatFilters = {}, limit = 60): Promise<PublicBeat[]> {
  const supabase = await createClient();
  let query = supabase
    .from("beats")
    .select(BEAT_PUBLIC_SELECT)
    .eq("status", "published")
    .eq("is_hidden", false);

  const q = filters.q?.trim().replace(/[%,()]/g, " ").slice(0, 60);
  if (q) {
    const tag = /^[\p{L}\p{N}-]+$/u.test(q) ? `,tags.cs.{${q.toLowerCase()}}` : "";
    query = query.or(`title.ilike.%${q}%,genre.ilike.%${q}%${tag}`);
  }
  if (filters.genre) query = query.eq("genre", filters.genre);
  if (filters.mood) query = query.eq("mood", filters.mood);
  if (filters.key) query = query.eq("musical_key", filters.key);
  if (filters.bpm && filters.bpm in BPM_RANGES) {
    const [min, max] = BPM_RANGES[filters.bpm];
    query = query.gte("bpm", min).lte("bpm", max);
  }

  if (filters.tri === "populaire") query = query.order("plays_count", { ascending: false });
  else if (filters.tri === "prix") query = query.order("price_mp3_fcfa", { ascending: true, nullsFirst: false });
  else query = query.order("created_at", { ascending: false });

  const { data } = await query.limit(limit);
  return (data ?? []).map(normalize);
}

/** Les plus écoutées (au moins une écoute). */
export async function listTrendingBeats(limit = 8): Promise<PublicBeat[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("beats")
    .select(BEAT_PUBLIC_SELECT)
    .eq("status", "published")
    .eq("is_hidden", false)
    .gt("plays_count", 0)
    .order("plays_count", { ascending: false })
    .limit(limit);
  return (data ?? []).map(normalize);
}

export const getBeatByPublicId = cache(async (publicId: string): Promise<PublicBeat | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("beats")
    .select(BEAT_PUBLIC_SELECT)
    .eq("public_id", publicId)
    .eq("status", "published")
    .eq("is_hidden", false)
    .maybeSingle();
  return data ? normalize(data) : null;
});

export async function listBeatsByArtist(artistId: string, excludeId?: string, limit = 60) {
  const supabase = await createClient();
  let query = supabase
    .from("beats")
    .select(BEAT_PUBLIC_SELECT)
    .eq("artist_id", artistId)
    .eq("status", "published")
    .eq("is_hidden", false);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map(normalize);
}

export type Beatmaker = BeatArtist & { bio: string | null; beats: number; plays: number };

/** Beatmakers ayant au moins une prod en ligne, classés par écoutes. */
export async function listBeatmakers(limit = 12): Promise<Beatmaker[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("beats")
    .select("plays_count, artists(id, public_id, stage_name, avatar_url, country, is_verified, bio)")
    .eq("status", "published")
    .eq("is_hidden", false)
    .limit(1000);
  const map = new Map<string, Beatmaker>();
  for (const row of data ?? []) {
    const a = (Array.isArray(row.artists) ? row.artists[0] : row.artists) as (BeatArtist & { bio: string | null }) | null;
    if (!a) continue;
    const cur = map.get(a.id) ?? { ...a, beats: 0, plays: 0 };
    cur.beats += 1;
    cur.plays += row.plays_count;
    map.set(a.id, cur);
  }
  return [...map.values()].sort((x, y) => y.plays - x.plays || y.beats - x.beats).slice(0, limit);
}

export const getBeatmaker = cache(async (publicId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("artists")
    .select("id, public_id, stage_name, avatar_url, country, is_verified, bio")
    .eq("public_id", publicId)
    .maybeSingle();
  return data as (BeatArtist & { bio: string | null }) | null;
});

/** Genres présents dans le catalogue, avec leur nombre de prods. */
export async function listBeatGenres(): Promise<{ genre: string; count: number }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("beats")
    .select("genre")
    .eq("status", "published")
    .eq("is_hidden", false)
    .not("genre", "is", null)
    .limit(1000);
  const counts = new Map<string, number>();
  for (const r of data ?? []) counts.set(r.genre as string, (counts.get(r.genre as string) ?? 0) + 1);
  return [...counts.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre, "fr"));
}

/** Pays du visiteur connecté (affichage des prix en devise locale), sinon null = FCFA. */
export const getViewerCountry = cache(async (): Promise<string | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("profiles").select("country").eq("id", user.id).maybeSingle();
    return data?.country ?? null;
  } catch {
    return null;
  }
});

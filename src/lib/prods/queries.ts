import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const BEAT_PUBLIC_SELECT =
  "id, public_id, title, cover_url, genre, mood, bpm, musical_key, tags, duration_seconds, price_mp3_fcfa, price_wav_fcfa, price_stems_fcfa, plays_count, created_at, owner_id, credits, artists(id, public_id, stage_name, avatar_url, country, is_verified)" as const;

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
  created_at: string;
  owner_id: string;
  credits: unknown;
  artists: {
    id: string;
    public_id: string;
    stage_name: string;
    avatar_url: string | null;
    country: string | null;
    is_verified: boolean;
  } | null;
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
  const r = row as PublicBeat & { artists: PublicBeat["artists"] | PublicBeat["artists"][] };
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
  if (q) query = query.ilike("title", `%${q}%`);
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

export async function listBeatsByArtist(artistId: string, excludeId: string, limit = 6) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("beats")
    .select(BEAT_PUBLIC_SELECT)
    .eq("artist_id", artistId)
    .eq("status", "published")
    .eq("is_hidden", false)
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(normalize);
}

/** Genres présents dans le catalogue (pour les filtres). */
export async function listBeatGenres(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("beats")
    .select("genre")
    .eq("status", "published")
    .eq("is_hidden", false)
    .not("genre", "is", null)
    .limit(500);
  return [...new Set((data ?? []).map((r) => r.genre as string))].sort((a, b) => a.localeCompare(b, "fr"));
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

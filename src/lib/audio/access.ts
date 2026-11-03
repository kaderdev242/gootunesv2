import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { PREVIEW_SECONDS } from "./constants";

export type PlaybackAccess = {
  access: "preview" | "full";
  owned: boolean;
  previewSeconds: number;
  trackId: string;
  releaseId: string;
  ownerId: string;
  title: string;
  durationSeconds: number | null;
};

/**
 * Identité de l'auditeur sans appel réseau : le JWT est vérifié localement
 * (clés ES256 du projet, JWKS mis en cache). `bearer` = jeton de l'app mobile.
 */
async function readUserId(
  supabase: SupabaseClient<Database>,
  bearer?: string | null,
): Promise<string | null> {
  try {
    const { data } = bearer
      ? await supabase.auth.getClaims(bearer)
      : await supabase.auth.getClaims();
    const sub = data?.claims?.sub;
    return typeof sub === "string" && sub ? sub : null;
  } catch {
    return null;
  }
}

export async function getTrackPlaybackAccess(
  trackId: string,
  client?: SupabaseClient<Database>,
  bearer?: string | null,
): Promise<
  | (PlaybackAccess & {
      audioUrl: string;
      status: "ok";
    })
  | { status: "not_found" }
  | { status: "unavailable" }
> {
  const supabase = client ?? (await createClient());
  const userId = await readUserId(supabase, bearer);

  // Morceau et achat éventuel en parallèle (un seul aller-retour base).
  const [{ data: track }, libraryRes] = await Promise.all([
    supabase
      .from("tracks")
      .select(
        "id, title, audio_url, duration_seconds, release_id, releases!inner(id, owner_id, status, is_hidden)",
      )
      .eq("id", trackId)
      .maybeSingle(),
    userId
      ? supabase
          .from("library_items")
          .select("id, releases!inner(tracks!inner(id))")
          .eq("user_id", userId)
          .eq("releases.tracks.id", trackId)
          .limit(1)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  if (!track) return { status: "not_found" };

  const release = track.releases as unknown as {
    id: string;
    owner_id: string;
    status: string;
    is_hidden: boolean;
  };

  const isOwner = !!userId && release.owner_id === userId;
  if (release.status !== "published" && !isOwner) {
    return { status: "unavailable" };
  }

  if (!track.audio_url) return { status: "unavailable" };

  const owned =
    isOwner || ((libraryRes.data as unknown[] | null)?.length ?? 0) > 0;

  // Masqué (admin ou suspension) : pas de preview public ;
  // propriétaire et acheteurs gardent l'accès full.
  if (release.is_hidden && !owned) {
    return { status: "unavailable" };
  }

  return {
    status: "ok",
    access: owned ? "full" : "preview",
    owned,
    previewSeconds: PREVIEW_SECONDS,
    trackId: track.id,
    releaseId: release.id,
    ownerId: release.owner_id,
    title: track.title,
    durationSeconds: track.duration_seconds,
    audioUrl: track.audio_url,
  };
}

export async function userOwnsRelease(
  userId: string,
  releaseId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("library_items")
    .select("id")
    .eq("user_id", userId)
    .eq("release_id", releaseId)
    .maybeSingle();
  return !!data;
}

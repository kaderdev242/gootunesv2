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

export async function getTrackPlaybackAccess(
  trackId: string,
  client?: SupabaseClient<Database>,
): Promise<
  | (PlaybackAccess & {
      audioUrl: string;
      status: "ok";
    })
  | { status: "not_found" }
  | { status: "unavailable" }
> {
  const supabase = client ?? (await createClient());
  const [{ data: authData }, { data: track }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("tracks")
      .select(
        "id, title, audio_url, duration_seconds, release_id, releases!inner(id, owner_id, status, is_hidden)",
      )
      .eq("id", trackId)
      .maybeSingle(),
  ]);
  const user = authData?.user ?? null;

  if (!track) return { status: "not_found" };

  const release = track.releases as unknown as {
    id: string;
    owner_id: string;
    status: string;
    is_hidden: boolean;
  };

  const isOwner = release.owner_id === user?.id;
  if (release.status !== "published" && !isOwner) {
    return { status: "unavailable" };
  }

  if (!track.audio_url) return { status: "unavailable" };

  let owned = false;
  if (user) {
    if (isOwner) {
      owned = true;
    } else {
      const { data: library } = await supabase
        .from("library_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("release_id", release.id)
        .maybeSingle();
      owned = !!library;
    }
  }

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

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logServerError, mapDbError } from "@/lib/errors";
import type { ReleaseType } from "@/lib/supabase/database.types";
import type { ActionState } from "./profile";
import { revalidateCatalog, runCreateRelease } from "@/lib/creator/publish";

export async function createRelease(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let tracks: {
    title: string;
    audio_url: string;
    track_number: number;
    duration_seconds?: number;
    is_explicit?: boolean;
  }[] = [];
  try {
    tracks = JSON.parse(String(formData.get("tracks") || "[]"));
  } catch {
    return { error: "Pistes invalides." };
  }

  const supabase = await createClient();
  const result = await runCreateRelease(supabase, {
    type: String(formData.get("type") || "") as ReleaseType,
    title: String(formData.get("title") || ""),
    artist_id: String(formData.get("artist_id") || ""),
    cover_url: String(formData.get("cover_url") || ""),
    price_fcfa: Number(formData.get("price_fcfa") || 0),
    genre: String(formData.get("genre") || ""),
    featuring: String(formData.get("featuring") || ""),
    auteur: String(formData.get("auteur") || ""),
    compositeur: String(formData.get("compositeur") || ""),
    producteur: String(formData.get("producteur") || ""),
    status: String(formData.get("status") || "published"),
    ownership_certified:
      String(formData.get("ownership_certified") || "") === "true",
    tracks,
  });

  if (result.error) return result;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };

  redirect(profile?.role === "label" ? "/label/publications" : "/artist/publications");
}

export async function deleteRelease(releaseId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: release } = await supabase
    .from("releases")
    .select("id, owner_id")
    .eq("id", releaseId)
    .maybeSingle();

  if (!release || release.owner_id !== user.id) {
    return { error: "Publication introuvable." };
  }

  const { error } = await supabase.from("releases").delete().eq("id", releaseId);
  if (error) {
    logServerError("publish.deleteRelease", error);
    return { error: mapDbError(error, "Impossible de supprimer la publication.") };
  }

  revalidateCatalog();
  return { success: "Publication supprimée." };
}

export async function deleteTrack(trackId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: track } = await supabase
    .from("tracks")
    .select("id, release_id")
    .eq("id", trackId)
    .maybeSingle();

  if (!track) return { error: "Titre introuvable." };

  const { data: release } = await supabase
    .from("releases")
    .select("id, owner_id, type")
    .eq("id", track.release_id)
    .maybeSingle();

  if (!release || release.owner_id !== user.id) {
    return { error: "Non autorisé." };
  }

  if (release.type === "single") {
    const { error } = await supabase
      .from("releases")
      .delete()
      .eq("id", release.id);
    if (error) {
      logServerError("publish.deleteSingleRelease", error);
      return { error: mapDbError(error, "Impossible de supprimer le single.") };
    }
  } else {
    const { count } = await supabase
      .from("tracks")
      .select("*", { count: "exact", head: true })
      .eq("release_id", release.id);

    if ((count ?? 0) <= 2) {
      return {
        error:
          "Un album doit garder au moins 2 titres. Supprime l'album entier.",
      };
    }

    const { error } = await supabase.from("tracks").delete().eq("id", trackId);
    if (error) {
      logServerError("publish.deleteTrack", error);
      return { error: mapDbError(error, "Impossible de supprimer le titre.") };
    }
  }

  revalidateCatalog();
  return { success: "Titre supprimé." };
}

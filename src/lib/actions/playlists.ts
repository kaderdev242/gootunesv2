"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logServerError, mapDbError } from "@/lib/errors";
import type { ActionState } from "./profile";

function touchPaths(playlistId?: string) {
  revalidatePath("/");
  revalidatePath("/discover");
  revalidatePath("/discover/playlists");
  if (playlistId) revalidatePath(`/discover/playlists/${playlistId}`);
}

function readIsPublic(formData: FormData) {
  const raw = formData.get("is_public");
  return raw === "on" || raw === "true" || raw === "1";
}

export async function createPlaylist(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const cover_url = String(formData.get("cover_url") || "").trim() || null;
  const is_public = readIsPublic(formData);

  if (!title) return { error: "Le titre est obligatoire." };
  if (title.length > 80) return { error: "Titre trop long (80 car. max)." };
  if (description.length > 400) {
    return { error: "Description trop longue (400 car. max)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connecte-toi pour créer une playlist." };

  const { data, error } = await supabase
    .from("playlists")
    .insert({
      user_id: user.id,
      title,
      description,
      cover_url,
      is_public,
    })
    .select("id")
    .single();

  if (error || !data) {
    logServerError("playlists.create", error);
    return { error: mapDbError(error, "Impossible de créer la playlist.") };
  }

  touchPaths(data.id);
  return {
    success: is_public
      ? `Playlist « ${title} » créée et partagée publiquement.`
      : `Playlist « ${title} » créée.`,
    actionHref: `/discover/playlists/${data.id}`,
    actionLabel: "Ouvrir",
  };
}

export async function updatePlaylist(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const playlistId = String(formData.get("playlist_id") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const cover_url = String(formData.get("cover_url") || "").trim() || null;
  const is_public = readIsPublic(formData);

  if (!playlistId || !title) return { error: "Titre requis." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase
    .from("playlists")
    .update({
      title,
      description,
      cover_url,
      is_public,
      updated_at: new Date().toISOString(),
    })
    .eq("id", playlistId)
    .eq("user_id", user.id);

  if (error) {
    logServerError("playlists.update", error);
    return { error: mapDbError(error, "Impossible de mettre à jour la playlist.") };
  }

  touchPaths(playlistId);
  return { success: "Playlist mise à jour." };
}

/** Sauvegarde / retire une playlist publique de la collection du fan. */
export async function togglePlaylistSave(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const playlistId = String(formData.get("playlist_id") || "");
  if (!playlistId) return { error: "Playlist introuvable." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Connecte-toi pour sauvegarder cette playlist.",
      actionHref: `/connexion?next=/discover/playlists/${playlistId}`,
      actionLabel: "Connexion",
    };
  }

  const { data: playlist } = await supabase
    .from("playlists")
    .select("id, title, is_public, user_id")
    .eq("id", playlistId)
    .maybeSingle();

  if (!playlist) return { error: "Playlist introuvable." };
  if (playlist.user_id === user.id) {
    return { error: "Tu ne peux pas sauvegarder ta propre playlist." };
  }
  if (!playlist.is_public) {
    return { error: "Cette playlist n’est pas publique." };
  }

  const { data: existing } = await supabase
    .from("playlist_saves")
    .select("id")
    .eq("playlist_id", playlistId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("playlist_saves")
      .delete()
      .eq("id", existing.id);
    if (error) {
      logServerError("playlists.unsave", error);
      return { error: mapDbError(error, "Impossible de retirer la sauvegarde.") };
    }
    touchPaths(playlistId);
    return { success: "Playlist retirée de tes sauvegardes." };
  }

  const { error } = await supabase.from("playlist_saves").insert({
    user_id: user.id,
    playlist_id: playlistId,
  });

  if (error) {
    logServerError("playlists.save", error);
    return { error: mapDbError(error, "Impossible de sauvegarder la playlist.") };
  }

  touchPaths(playlistId);
  return {
    success: `« ${playlist.title} » sauvegardée.`,
    actionHref: `/discover/playlists/${playlistId}`,
    actionLabel: "Voir",
  };
}

export async function deletePlaylist(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const playlistId = String(formData.get("playlist_id") || "");
  if (!playlistId) return { error: "Playlist introuvable." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase
    .from("playlists")
    .delete()
    .eq("id", playlistId)
    .eq("user_id", user.id);

  if (error) {
    logServerError("playlists.delete", error);
    return { error: mapDbError(error, "Impossible de supprimer la playlist.") };
  }

  touchPaths();
  return {
    success: "Playlist supprimée.",
    actionHref: "/discover/playlists",
    actionLabel: "Voir les playlists",
  };
}

export async function addTrackToPlaylist(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const playlistId = String(formData.get("playlist_id") || "");
  const trackId = String(formData.get("track_id") || "");
  if (!playlistId || !trackId) {
    return { error: "Playlist et morceau requis." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connecte-toi pour ajouter un morceau." };

  const { data: playlist } = await supabase
    .from("playlists")
    .select("id, title")
    .eq("id", playlistId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!playlist) return { error: "Playlist introuvable." };

  const { count } = await supabase
    .from("playlist_tracks")
    .select("id", { count: "exact", head: true })
    .eq("playlist_id", playlistId);

  const { error } = await supabase.from("playlist_tracks").upsert(
    {
      playlist_id: playlistId,
      track_id: trackId,
      position: count || 0,
    },
    { onConflict: "playlist_id,track_id", ignoreDuplicates: true },
  );

  if (error) {
    logServerError("playlists.addTrack", error);
    return { error: mapDbError(error, "Impossible d'ajouter le morceau.") };
  }

  await supabase
    .from("playlists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", playlistId);

  touchPaths(playlistId);
  return {
    success: `Ajouté à « ${playlist.title} ».`,
    actionHref: `/discover/playlists/${playlistId}`,
    actionLabel: "Voir",
  };
}

export async function removeTrackFromPlaylist(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const playlistId = String(formData.get("playlist_id") || "");
  const trackId = String(formData.get("track_id") || "");
  if (!playlistId || !trackId) return { error: "Données manquantes." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: playlist } = await supabase
    .from("playlists")
    .select("id")
    .eq("id", playlistId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!playlist) return { error: "Playlist introuvable." };

  const { error } = await supabase
    .from("playlist_tracks")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("track_id", trackId);

  if (error) {
    logServerError("playlists.removeTrack", error);
    return { error: mapDbError(error, "Impossible de retirer le morceau.") };
  }

  await supabase
    .from("playlists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", playlistId);

  touchPaths(playlistId);
  return { success: "Morceau retiré de la playlist." };
}

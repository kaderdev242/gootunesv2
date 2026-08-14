"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MIN_RELEASE_PRICE_FCFA } from "@/lib/constants";
import {
  currencyLabelForCountry,
  localToFcfa,
  minReleasePriceLocal,
} from "@/lib/currency";
import { notifyReleasePublished } from "@/lib/email/notify";
import { logServerError, mapDbError, USER_ERRORS } from "@/lib/errors";
import { hasActiveArtistPlan } from "@/lib/artist-plan";
import type { ReleaseType } from "@/lib/supabase/database.types";
import type { ActionState } from "./profile";

function revalidateCatalog() {
  revalidatePath("/artist/publications");
  revalidatePath("/label/publications");
  revalidatePath("/discover");
}

export async function createRelease(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const type = String(formData.get("type") || "") as ReleaseType;
  const title = String(formData.get("title") || "").trim();
  const artist_id = String(formData.get("artist_id") || "");
  const cover_url = String(formData.get("cover_url") || "").trim();
  const priceLocal = Number(formData.get("price_fcfa") || 0);
  const genre = String(formData.get("genre") || "").trim();
  const featuring = String(formData.get("featuring") || "").trim();
  const auteur = String(formData.get("auteur") || "").trim();
  const compositeur = String(formData.get("compositeur") || "").trim();
  const producteur = String(formData.get("producteur") || "").trim();
  const status = String(formData.get("status") || "published");
  const tracksJson = String(formData.get("tracks") || "[]");
  const ownershipCertified =
    String(formData.get("ownership_certified") || "") === "true";

  if (!["single", "album"].includes(type)) return { error: "Type invalide." };
  if (!title || !artist_id) return { error: "Titre et artiste requis." };
  if (!cover_url) return { error: "Cover 1000×1000 obligatoire." };
  if (!ownershipCertified) {
    return {
      error:
        "Tu dois certifier être l'auteur et propriétaire du morceau avant de publier.",
    };
  }

  let tracks: {
    title: string;
    audio_url: string;
    track_number: number;
    duration_seconds?: number;
  }[] = [];

  try {
    tracks = JSON.parse(tracksJson);
  } catch {
    return { error: "Pistes invalides." };
  }

  if (!tracks.length) return { error: "Au moins un fichier audio requis." };
  if (type === "single" && tracks.length !== 1) {
    return { error: "Un single doit contenir exactement 1 piste." };
  }
  if (type === "album" && tracks.length < 2) {
    return { error: "Un album nécessite au moins 2 pistes." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "country, role, email, artist_plan, artist_plan_expires_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "artist" && !hasActiveArtistPlan(profile)) {
    return {
      error: "Abonnement artiste requis pour publier.",
      actionHref: "/artist/abonnement",
      actionLabel: "Activer l'abonnement",
    };
  }

  const country = profile?.country;
  const price_fcfa = localToFcfa(priceLocal, country);
  const minLocal = minReleasePriceLocal(country);

  if (!Number.isFinite(priceLocal) || price_fcfa < MIN_RELEASE_PRICE_FCFA) {
    return {
      error: `Prix minimum : ${minLocal} ${currencyLabelForCountry(country)} (requis pour le Mobile Money).`,
    };
  }

  const { data: artist } = await supabase
    .from("artists")
    .select("id, owner_id, label_id")
    .eq("id", artist_id)
    .maybeSingle();

  if (!artist || (artist.owner_id !== user.id && artist.label_id !== user.id)) {
    return { error: "Artiste non autorisé." };
  }

  const credits = { auteur, compositeur, producteur };

  const { data: release, error } = await supabase
    .from("releases")
    .insert({
      artist_id,
      owner_id: user.id,
      type,
      title,
      cover_url: cover_url || null,
      price_fcfa,
      genre: genre || null,
      featuring: featuring || null,
      credits,
      status: status === "draft" ? "draft" : "published",
    })
    .select("id, public_id")
    .single();

  if (error || !release) {
    logServerError("publish.createRelease", error);
    return {
      error: mapDbError(error, USER_ERRORS.publish),
    };
  }

  const { error: tracksError } = await supabase.from("tracks").insert(
    tracks.map((t, i) => ({
      release_id: release.id,
      title: t.title || `${title} — piste ${i + 1}`,
      audio_url: t.audio_url,
      track_number: t.track_number || i + 1,
      duration_seconds: t.duration_seconds ?? null,
      credits,
    })),
  );

  if (tracksError) {
    logServerError("publish.createTracks", tracksError);
    return {
      error: mapDbError(tracksError, "Impossible d'enregistrer les pistes."),
    };
  }

  revalidateCatalog();

  const { data: artistRow } = await supabase
    .from("artists")
    .select("stage_name")
    .eq("id", artist_id)
    .maybeSingle();

  if (profile?.email && status !== "draft") {
    notifyReleasePublished({
      email: profile.email,
      title,
      type,
      artistName: artistRow?.stage_name || "Artiste",
      priceFcfa: price_fcfa,
      releaseId: release.public_id || release.id,
    });
  }

  redirect(
    profile?.role === "label"
      ? "/label/publications"
      : "/artist/publications",
  );
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

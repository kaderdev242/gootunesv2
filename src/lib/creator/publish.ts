import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath, revalidateTag } from "next/cache";
import { isReleasePriceTier } from "@/lib/purchases/apple-tiers";
import { notifyReleasePublished } from "@/lib/email/notify";
import { logServerError, mapDbError, USER_ERRORS } from "@/lib/errors";
import { hasActiveArtistPlan } from "@/lib/artist-plan";
import { ensureTrackDurationSeconds } from "@/lib/audio/probe-duration";
import type { Database, ReleaseType } from "@/lib/supabase/database.types";
import type { ActionState } from "@/lib/actions/profile";

type Sb = SupabaseClient<Database>;

export type CreateReleaseInput = {
  type: ReleaseType;
  title: string;
  artist_id: string;
  cover_url: string;
  price_fcfa: number;
  genre?: string;
  featuring?: string;
  auteur?: string;
  compositeur?: string;
  producteur?: string;
  status?: string;
  ownership_certified: boolean;
  tracks: {
    title: string;
    audio_url: string;
    track_number: number;
    duration_seconds?: number;
    is_explicit?: boolean;
  }[];
};

export function revalidateCatalog() {
  revalidatePath("/artist/publications");
  revalidatePath("/label/publications");
  revalidatePath("/discover");
  revalidatePath("/");
  revalidatePath("/discover/catalogue");
  revalidateTag("discover-releases", "max");
}

export async function runCreateRelease(
  supabase: Sb,
  input: CreateReleaseInput,
): Promise<ActionState & { releaseId?: string; publicId?: string }> {
  const type = input.type;
  const title = input.title.trim();
  const artist_id = input.artist_id;
  const cover_url = input.cover_url.trim();
  const price_fcfa = Number(input.price_fcfa || 0);
  const tracks = input.tracks || [];

  if (!["single", "album"].includes(type)) return { error: "Type invalide." };
  if (!title || !artist_id) return { error: "Titre et artiste requis." };
  if (!cover_url) return { error: "Cover 1000×1000 obligatoire." };
  if (!input.ownership_certified) {
    return {
      error:
        "Tu dois certifier être l'auteur et propriétaire du morceau avant de publier.",
    };
  }
  if (!tracks.length) return { error: "Au moins un fichier audio requis." };
  if (type === "single" && tracks.length !== 1) {
    return { error: "Un single doit contenir exactement 1 piste." };
  }
  if (type === "album" && tracks.length < 2) {
    return { error: "Un album nécessite au moins 2 pistes." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("country, role, email, artist_plan, artist_plan_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "artist" && !hasActiveArtistPlan(profile)) {
    return {
      error: "Abonnement artiste requis pour publier.",
      actionHref: "/artist/abonnement",
      actionLabel: "Activer l'abonnement",
    };
  }

  if (!isReleasePriceTier(price_fcfa)) {
    return { error: "Choisis un palier de prix." };
  }

  const { data: artist } = await supabase
    .from("artists")
    .select("id, owner_id, label_id")
    .eq("id", artist_id)
    .maybeSingle();

  if (!artist || (artist.owner_id !== user.id && artist.label_id !== user.id)) {
    return { error: "Artiste non autorisé." };
  }

  const credits = {
    auteur: input.auteur?.trim() || "",
    compositeur: input.compositeur?.trim() || "",
    producteur: input.producteur?.trim() || "",
  };

  const { data: release, error } = await supabase
    .from("releases")
    .insert({
      artist_id,
      owner_id: user.id,
      type,
      title,
      cover_url: cover_url || null,
      price_fcfa,
      genre: input.genre?.trim() || null,
      featuring: input.featuring?.trim() || null,
      credits,
      status: input.status === "draft" ? "draft" : "published",
    })
    .select("id, public_id")
    .single();

  if (error || !release) {
    logServerError("publish.createRelease", error);
    return { error: mapDbError(error, USER_ERRORS.publish) };
  }

  const { error: tracksError } = await supabase.from("tracks").insert(
    tracks.map((t, i) => ({
      release_id: release.id,
      title: t.title || `${title} — piste ${i + 1}`,
      audio_url: t.audio_url,
      track_number: t.track_number || i + 1,
      duration_seconds: t.duration_seconds ?? null,
      is_explicit: Boolean(t.is_explicit),
      credits,
    })),
  );

  if (tracksError) {
    logServerError("publish.createTracks", tracksError);
    return {
      error: mapDbError(tracksError, "Impossible d'enregistrer les pistes."),
    };
  }

  const { data: insertedTracks } = await supabase
    .from("tracks")
    .select("id, audio_url, duration_seconds")
    .eq("release_id", release.id);

  await Promise.all(
    (insertedTracks ?? []).map((t) =>
      t.audio_url
        ? ensureTrackDurationSeconds({
            trackId: t.id,
            audioUrl: t.audio_url,
            currentDuration: t.duration_seconds,
          })
        : Promise.resolve(null),
    ),
  );

  revalidateCatalog();

  const { data: artistRow } = await supabase
    .from("artists")
    .select("stage_name")
    .eq("id", artist_id)
    .maybeSingle();

  if (profile?.email && input.status !== "draft") {
    notifyReleasePublished({
      email: profile.email,
      title,
      type,
      artistName: artistRow?.stage_name || "Artiste",
      priceFcfa: price_fcfa,
      releaseId: release.public_id || release.id,
    });
  }

  return {
    success: "Publication en ligne.",
    releaseId: release.id,
    publicId: release.public_id,
  };
}

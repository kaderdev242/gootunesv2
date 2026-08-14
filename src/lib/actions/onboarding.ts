"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { creatorHome } from "@/lib/dashboard/paths";
import { isMusicGenre } from "@/lib/genres";
import { isCountryCode } from "@/lib/geo";
import { logServerError, mapDbError } from "@/lib/errors";

export type OnboardingState = {
  error?: string;
};

function wordCount(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const displayName = String(formData.get("display_name") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const avatarUrl = String(formData.get("avatar_url") || "").trim();
  const genresRaw = String(formData.get("genres") || "");
  const genres = genresRaw
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  if (!displayName) return { error: "Le nom est obligatoire." };
  if (!country || !isCountryCode(country)) return { error: "Pays invalide." };
  if (!phone) return { error: "Téléphone obligatoire." };
  if (!bio) return { error: "Description obligatoire." };
  if (wordCount(bio) > 60) {
    return { error: "La description doit faire 60 mots maximum." };
  }
  if (!genres.length || !genres.every(isMusicGenre)) {
    return { error: "Sélectionne au moins un genre valide." };
  }
  if (!avatarUrl) return { error: "Photo de profil obligatoire." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée. Reconnecte-toi." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "artist" && profile.role !== "label")) {
    return { error: "Onboarding réservé aux artistes et labels." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      country,
      phone,
      bio,
      genres,
      avatar_url: avatarUrl,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (profileError) {
    logServerError("onboarding.profile", profileError);
    return {
      error: mapDbError(profileError, "Impossible de finaliser ton profil."),
    };
  }

  if (profile.role === "artist") {
    const { data: existing } = await supabase
      .from("artists")
      .select("id")
      .eq("owner_id", user.id)
      .is("label_id", null)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("artists")
        .update({
          stage_name: displayName,
          bio,
          avatar_url: avatarUrl,
          country,
        })
        .eq("id", existing.id);
      if (error) {
        logServerError("onboarding.artist.update", error);
        return {
          error: mapDbError(error, "Impossible de mettre à jour l'artiste."),
        };
      }
    } else {
      const { error } = await supabase.from("artists").insert({
        owner_id: user.id,
        stage_name: displayName,
        bio,
        avatar_url: avatarUrl,
        country,
      });
      if (error) {
        logServerError("onboarding.artist.insert", error);
        return {
          error: mapDbError(error, "Impossible de créer le profil artiste."),
        };
      }
    }
  }

  redirect(creatorHome(profile.role));
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isMusicGenre } from "@/lib/genres";
import { isCountryCode } from "@/lib/geo";
import { isValidMbiyoPhone, normalizeMbiyoPhone } from "@/lib/mbiyo/config";
import { logServerError, mapAuthError, mapDbError } from "@/lib/errors";
import type { ActionState } from "@/lib/actions/profile";

/** Paramètres du compte fan (Discover) : pseudo, photo, pays, numéro d'achat, goûts. */
export async function updateFanSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
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
  if (profile?.role !== "fan") {
    return { error: "Ces paramètres sont réservés aux comptes fans." };
  }

  const displayName = String(formData.get("display_name") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const phoneRaw = String(formData.get("phone") || "").trim();
  const avatarUrl = String(formData.get("avatar_url") || "").trim();
  const genres = String(formData.get("genres") || "")
    .split(",")
    .map((g) => g.trim())
    .filter((g) => g && isMusicGenre(g));

  if (displayName.length < 2) {
    return { error: "Le pseudo doit contenir au moins 2 caractères." };
  }
  if (displayName.length > 40) {
    return { error: "Le pseudo doit faire 40 caractères maximum." };
  }
  if (!isCountryCode(country)) return { error: "Pays invalide." };

  let phone: string | null = null;
  if (phoneRaw) {
    const normalized = normalizeMbiyoPhone(phoneRaw, country);
    if (!isValidMbiyoPhone(normalized, country)) {
      return {
        error: "Numéro Mobile Money invalide pour ce pays.",
      };
    }
    phone = phoneRaw;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      country,
      phone,
      avatar_url: avatarUrl || null,
      genres,
    })
    .eq("id", user.id);

  if (error) {
    logServerError("fan.settings.update", error);
    return { error: mapDbError(error, "Impossible d'enregistrer tes paramètres.") };
  }

  revalidatePath("/", "layout");
  return { success: "Paramètres enregistrés." };
}

export async function updateFanPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("password_confirm") || "");

  if (password.length < 6) {
    return { error: "Le mot de passe doit contenir au moins 6 caractères." };
  }
  if (password !== confirm) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée. Reconnecte-toi." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    logServerError("fan.settings.password", error);
    return { error: mapAuthError(error) };
  }
  return { success: "Mot de passe mis à jour." };
}

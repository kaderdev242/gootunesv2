"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isMusicGenre } from "@/lib/genres";
import { logServerError, mapDbError } from "@/lib/errors";

export type ActionState = {
  error?: string;
  success?: string;
  /** Bouton d'action optionnel dans le toast (ex. lien Abonnement) */
  actionHref?: string;
  actionLabel?: string;
  /** Paiement Mobile Money en cours */
  paymentPending?: boolean;
  orderId?: string;
  purchaseId?: string;
  providerTransactionId?: string;
  instructionsHtml?: string | null;
  authMode?: string | null;
  redirectUrl?: string | null;
};

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const phone = String(formData.get("phone") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const avatar_url = String(formData.get("avatar_url") || "").trim();
  const genresRaw = String(formData.get("genres") || "").trim();
  const genres = genresRaw
    ? genresRaw
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g && isMusicGenre(g))
    : [];

  const { error } = await supabase
    .from("profiles")
    .update({
      phone: phone || null,
      bio: bio || null,
      avatar_url: avatar_url || null,
      genres,
      // display_name et country volontairement non modifiables
    })
    .eq("id", user.id);

  if (error) {
    logServerError("profile.update", error);
    return { error: mapDbError(error, "Impossible de mettre à jour le profil.") };
  }
  revalidatePath("/artist");
  revalidatePath("/label");
  revalidatePath("/artist/parametres");
  revalidatePath("/label/parametres");
  return { success: "Profil mis à jour." };
}

import { cache } from "react";
import { isFeatureEnabled } from "@/lib/features";
import { createClient } from "@/lib/supabase/server";

/**
 * Accès à la vitrine Prods.
 * - Fonctionnalité active : tout le monde.
 * - Désactivée : seuls les admins peuvent prévisualiser (bandeau « Aperçu admin »).
 */
export const getProdsAccess = cache(async (): Promise<{ allowed: boolean; preview: boolean }> => {
  if (await isFeatureEnabled("prods")) return { allowed: true, preview: false };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { allowed: false, preview: false };
    const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
    const isAdmin = Boolean(data?.is_admin) || adminEmails.includes((user.email || "").toLowerCase());
    return { allowed: isAdmin, preview: isAdmin };
  } catch {
    return { allowed: false, preview: false };
  }
});

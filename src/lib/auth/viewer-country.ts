import { createClient } from "@/lib/supabase/server";

/** Pays du profil connecté (affichage devise Discover / achat). */
export async function getViewerCountry(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("country")
    .eq("id", user.id)
    .maybeSingle();

  return data?.country ?? null;
}

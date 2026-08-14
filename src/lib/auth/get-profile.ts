import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/supabase/database.types";
import { creatorHome } from "@/lib/dashboard/paths";

/** Une seule lecture profil par requête RSC (layout + page). */
export const getSessionProfile = cache(async (): Promise<{
  userId: string;
  profile: Profile;
} | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) return null;

    // Répare les comptes créés avant le sync display_name
    const metaName =
      typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name.trim()
        : "";
    const metaCountry =
      typeof user.user_metadata?.country === "string"
        ? user.user_metadata.country.trim()
        : "";

    if (
      metaName &&
      (!profile.display_name || !profile.display_name.trim())
    ) {
      const patch: { display_name: string; country?: string | null } = {
        display_name: metaName,
      };
      if (metaCountry && !profile.country) patch.country = metaCountry;

      const { data: updated } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", user.id)
        .select("*")
        .maybeSingle();

      if (updated) {
        return { userId: user.id, profile: updated };
      }
    }

    return { userId: user.id, profile };
  } catch {
    return null;
  }
});

export async function requireCreatorProfile(
  expectedRole?: Extract<UserRole, "artist" | "label">,
) {
  const session = await getSessionProfile();
  if (!session) return null;
  if (session.profile.role !== "artist" && session.profile.role !== "label") {
    return null;
  }
  if (expectedRole && session.profile.role !== expectedRole) {
    return null;
  }
  return session;
}

export function homeForProfile(profile: Profile) {
  return creatorHome(profile.role);
}

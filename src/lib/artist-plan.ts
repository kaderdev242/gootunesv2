import type { ArtistPlan } from "@/lib/supabase/database.types";

/** Abonnement artiste actif (annual + non expiré). */
export function hasActiveArtistPlan(profile: {
  artist_plan?: ArtistPlan | string | null;
  artist_plan_expires_at?: string | null;
} | null | undefined): boolean {
  if (!profile) return false;
  if (profile.artist_plan !== "annual") return false;
  if (!profile.artist_plan_expires_at) return false;
  return new Date(profile.artist_plan_expires_at).getTime() > Date.now();
}

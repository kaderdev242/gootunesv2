"use server";

import { createClient } from "@/lib/supabase/server";

export async function recordTrackPlay(input: {
  trackId: string;
  releaseId: string;
  ownerId: string;
}): Promise<{ ok: boolean }> {
  const { trackId, releaseId, ownerId } = input;
  if (!trackId || !releaseId || !ownerId) return { ok: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ne pas compter les écoutes du propriétaire sur ses propres titres
  if (user?.id && user.id === ownerId) return { ok: true };

  let country: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("country")
      .eq("id", user.id)
      .maybeSingle();
    country = profile?.country ?? null;
  }

  const { error } = await supabase.from("track_plays").insert({
    track_id: trackId,
    release_id: releaseId,
    owner_id: ownerId,
    listener_id: user?.id ?? null,
    country,
  });

  return { ok: !error };
}

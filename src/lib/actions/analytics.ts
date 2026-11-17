"use server";

import { headers } from "next/headers";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const row = {
    track_id: trackId,
    release_id: releaseId,
    owner_id: ownerId,
    listener_id: user?.id ?? null,
    country,
  };

  if (user) {
    const { error } = await supabase.from("track_plays").insert(row);
    return { ok: !error };
  }

  // Visiteur non connecté : la base n'accepte que les insertions authentifiées,
  // on enregistre donc côté serveur, une écoute par IP et par titre toutes les 30 min.
  const ip = clientIpFromHeaders(await headers());
  const once = await checkRateLimit(`play:anon:${ip}:${trackId}`, 1, 30 * 60_000);
  if (!once.allowed) return { ok: true };
  try {
    const admin = createAdminClient();
    // Le titre doit exister et appartenir à cette publication / ce propriétaire.
    const { data: track } = await admin
      .from("tracks")
      .select("id, releases!inner(id, owner_id, status)")
      .eq("id", trackId)
      .eq("release_id", releaseId)
      .maybeSingle();
    const rel = (Array.isArray(track?.releases) ? track?.releases[0] : track?.releases) as
      | { owner_id: string; status: string }
      | undefined;
    if (!rel || rel.owner_id !== ownerId || rel.status !== "published") return { ok: false };
    const { error } = await admin.from("track_plays").insert(row);
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

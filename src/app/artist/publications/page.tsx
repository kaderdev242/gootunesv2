import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { PublicationsView } from "@/components/dashboard/PublicationsView";

export default async function PublicationsPage() {
  const session = await requireCreatorProfile("artist");
  if (!session) redirect("/connexion?next=/artist/publications");

  const supabase = await createClient();
  const { data: releases } = await supabase
    .from("releases")
    .select(
 "id, title, type, status, cover_url, price_fcfa, created_at, artists(stage_name), tracks(id, title, audio_url, track_number)",
    )
    .eq("owner_id", session.userId)
    .order("created_at", { ascending: false });

  const rows = (releases ?? []).map((r) => ({
    ...r,
    artists: Array.isArray(r.artists) ? r.artists[0] ?? null : r.artists,
    tracks: Array.isArray(r.tracks) ? r.tracks : [],
  }));

  return (
    <PublicationsView
      basePath="/artist"
      releases={rows}
      country={session.profile.country}
    />
  );
}

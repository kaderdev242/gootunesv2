import { NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request-client";
import { isCreatorSession, requireCreatorApi } from "@/lib/creator/require-api";

export const dynamic = "force-dynamic";

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] || null : v;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireCreatorApi(request);
  if (!isCreatorSession(session)) return session;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
  }

  const supabase = await createRequestClient(request);
  const { data: release } = await supabase
    .from("releases")
    .select(
      "id, public_id, title, type, status, cover_url, price_fcfa, genre, featuring, credits, created_at, is_hidden, artists(id, stage_name, avatar_url), tracks(id, title, track_number, duration_seconds, is_explicit, credits)",
    )
    .eq("id", id)
    .eq("owner_id", session.userId)
    .maybeSingle();

  if (!release) {
    return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  }

  const artist = one(
    release.artists as
      | { id: string; stage_name: string; avatar_url?: string | null }
      | { id: string; stage_name: string; avatar_url?: string | null }[]
      | null,
  );
  const tracks = Array.isArray(release.tracks) ? release.tracks : [];
  const credits =
    release.credits && typeof release.credits === "object"
      ? (release.credits as Record<string, unknown>)
      : {};

  return NextResponse.json({
    release: {
      id: release.id,
      public_id: release.public_id,
      title: release.title,
      type: release.type,
      status: release.status,
      cover_url: release.cover_url,
      price_fcfa: Number(release.price_fcfa) || 0,
      genre: release.genre,
      featuring: release.featuring,
      created_at: release.created_at,
      is_hidden: Boolean(release.is_hidden),
      auteur: String(credits.auteur || ""),
      compositeur: String(credits.compositeur || ""),
      producteur: String(credits.producteur || ""),
      artist_id: artist?.id || null,
      artist_name: artist?.stage_name || "—",
      artist_avatar: artist?.avatar_url || null,
      tracks: tracks
        .slice()
        .sort((a, b) => (a.track_number || 0) - (b.track_number || 0))
        .map((t) => {
          const tc =
            t.credits && typeof t.credits === "object"
              ? (t.credits as Record<string, unknown>)
              : {};
          return {
            id: t.id,
            title: t.title,
            track_number: t.track_number,
            duration_seconds: t.duration_seconds,
            is_explicit: Boolean(t.is_explicit),
            auteur: String(tc.auteur || credits.auteur || ""),
            compositeur: String(tc.compositeur || credits.compositeur || ""),
            producteur: String(tc.producteur || credits.producteur || ""),
          };
        }),
    },
  });
}

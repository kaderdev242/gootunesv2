import { NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request-client";
import { isCreatorSession, requireCreatorApi } from "@/lib/creator/require-api";
import { runCreateRelease } from "@/lib/creator/publish";
import type { ReleaseType } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] || null : v;
}

export async function GET(request: Request) {
  const session = await requireCreatorApi(request);
  if (!isCreatorSession(session)) return session;

  const supabase = await createRequestClient(request);
  const { data: releases } = await supabase
    .from("releases")
    .select(
      "id, public_id, title, type, status, cover_url, price_fcfa, genre, featuring, created_at, is_hidden, artists(stage_name, avatar_url), tracks(id, title, track_number, duration_seconds, is_explicit)",
    )
    .eq("owner_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(80);

  const rows = (releases ?? []).map((r) => {
    const artist = one(
      r.artists as
        | { stage_name: string; avatar_url?: string | null }
        | { stage_name: string; avatar_url?: string | null }[]
        | null,
    );
    const tracks = Array.isArray(r.tracks) ? r.tracks : [];
    return {
      id: r.id,
      public_id: r.public_id,
      title: r.title,
      type: r.type,
      status: r.status,
      cover_url: r.cover_url,
      price_fcfa: Number(r.price_fcfa) || 0,
      created_at: r.created_at,
      is_hidden: Boolean(r.is_hidden),
      genre: r.genre,
      featuring: r.featuring,
      artist_name: artist?.stage_name || "—",
      artist_avatar: artist?.avatar_url || null,
      tracks: tracks
        .slice()
        .sort((a, b) => (a.track_number || 0) - (b.track_number || 0))
        .map((t) => ({
          id: t.id,
          title: t.title,
          track_number: t.track_number,
          duration_seconds: t.duration_seconds,
          is_explicit: Boolean(t.is_explicit),
        })),
    };
  });

  return NextResponse.json({ releases: rows });
}

export async function POST(request: Request) {
  const session = await requireCreatorApi(request);
  if (!isCreatorSession(session)) return session;

  let body: CreateReleaseInputLoose = {};
  try {
    body = (await request.json()) as CreateReleaseInputLoose;
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const supabase = await createRequestClient(request);
  const result = await runCreateRelease(supabase, {
    type: String(body.type || "") as ReleaseType,
    title: String(body.title || ""),
    artist_id: String(body.artist_id || ""),
    cover_url: String(body.cover_url || ""),
    price_fcfa: Number(body.price_fcfa || 0),
    genre: String(body.genre || ""),
    featuring: String(body.featuring || ""),
    auteur: String(body.auteur || ""),
    compositeur: String(body.compositeur || ""),
    producteur: String(body.producteur || ""),
    status: String(body.status || "published"),
    ownership_certified: Boolean(body.ownership_certified),
    tracks: Array.isArray(body.tracks) ? body.tracks : [],
  });

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}

type CreateReleaseInputLoose = {
  type?: string;
  title?: string;
  artist_id?: string;
  cover_url?: string;
  price_fcfa?: number;
  genre?: string;
  featuring?: string;
  auteur?: string;
  compositeur?: string;
  producteur?: string;
  status?: string;
  ownership_certified?: boolean;
  tracks?: {
    title: string;
    audio_url: string;
    track_number: number;
    duration_seconds?: number;
    is_explicit?: boolean;
  }[];
};

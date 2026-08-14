import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureTrackDurationSeconds } from "@/lib/audio/probe-duration";
import { logServerError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Backfill des duration_seconds manquantes.
 * Protégé par header x-admin-secret = CRON_SECRET ou SUPABASE_SERVICE_ROLE_KEY.
 * Usage: POST /api/admin/backfill-durations?limit=30
 */
export async function POST(request: Request) {
  try {
    const secret =
      request.headers.get("x-admin-secret") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const expected =
      process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") || 40)),
    );

    const admin = createAdminClient();
    const { data: tracks, error } = await admin
      .from("tracks")
      .select("id, audio_url, duration_seconds")
      .or("duration_seconds.is.null,duration_seconds.eq.0")
      .not("audio_url", "is", null)
      .limit(limit);

    if (error) {
      logServerError("backfill.durations.list", error);
      return NextResponse.json({ error: "Lecture impossible" }, { status: 500 });
    }

    let updated = 0;
    let failed = 0;
    const samples: { id: string; duration: number }[] = [];

    for (const track of tracks ?? []) {
      if (!track.audio_url) {
        failed += 1;
        continue;
      }
      const duration = await ensureTrackDurationSeconds({
        trackId: track.id,
        audioUrl: track.audio_url,
        currentDuration: track.duration_seconds,
      });
      if (duration && duration > 0) {
        updated += 1;
        if (samples.length < 8) {
          samples.push({ id: track.id, duration });
        }
      } else {
        failed += 1;
      }
    }

    return NextResponse.json({
      scanned: tracks?.length ?? 0,
      updated,
      failed,
      samples,
    });
  } catch (e) {
    logServerError("backfill.durations", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

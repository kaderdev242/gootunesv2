import { NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request-client";
import { probeDurationFromR2Key } from "@/lib/audio/probe-duration";
import { logServerError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Durée MP3 après un PUT présigné R2.
 * Ne pas appeler depuis /play — uniquement à l’upload.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createRequestClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json()) as { key?: string };
    const key = body.key?.trim();
    if (!key) {
      return NextResponse.json({ error: "Clé manquante" }, { status: 400 });
    }

    const allowedPrefix = `audios/${user.id}/`;
    if (!key.startsWith(allowedPrefix) || key.includes("..")) {
      return NextResponse.json({ error: "Clé invalide" }, { status: 403 });
    }

    const durationSeconds = await probeDurationFromR2Key(key);
    return NextResponse.json({ durationSeconds });
  } catch (e) {
    logServerError("api.upload.audioDuration", e);
    return NextResponse.json({ durationSeconds: null }, { status: 200 });
  }
}

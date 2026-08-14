import { NextRequest, NextResponse } from "next/server";
import { getTrackPlaybackAccess } from "@/lib/audio/access";
import { PREVIEW_SECONDS } from "@/lib/audio/constants";
import { previewByteLimit } from "@/lib/audio/preview-bytes";
import { ensureTrackDurationSeconds } from "@/lib/audio/probe-duration";
import { generateStreamToken, getWorkerBaseUrl } from "@/lib/audio/token";
import { createPresignedGet, extractR2KeyFromUrl } from "@/lib/r2";
import { createRequestClient } from "@/lib/supabase/request-client";
import { logServerError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ trackId: string }> };

/**
 * Métadonnées de lecture & génération de token Cloudflare Worker.
 * - full  → URL R2 signée OU Worker streaming direct (fichier entier)
 * - preview → URL Cloudflare Worker avec token HMAC (borne serveur ~20s ultra-rapide)
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { trackId } = await params;
    const supabase = await createRequestClient(request);
    const access = await getTrackPlaybackAccess(trackId, supabase);

    if (access.status === "not_found") {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    if (access.status === "unavailable") {
      return NextResponse.json({ error: "Indisponible" }, { status: 403 });
    }

    const key = extractR2KeyFromUrl(access.audioUrl);
    if (!key) {
      return NextResponse.json({ error: "Fichier invalide" }, { status: 500 });
    }

    // Durée depuis la DB — jamais bloquante.
    const durationSeconds = access.durationSeconds ?? null;
    if (!durationSeconds) {
      void ensureTrackDurationSeconds({
        trackId: access.trackId,
        audioUrl: access.audioUrl,
        currentDuration: access.durationSeconds,
      });
    }

    const fullAccess = access.access === "full";
    const expiresIn = 600; // 10 minutes

    // Calcul de la borne d'octets autorisée pour ce token (20s si preview, illimité si full)
    const maxBytes = fullAccess
      ? 1_000_000_000 // 1 Go max pour full access
      : previewByteLimit(null, durationSeconds);

    // Token HMAC pour le Cloudflare Worker (<50ms latence)
    const streamToken = generateStreamToken(key, maxBytes, expiresIn);
    const workerBase = getWorkerBaseUrl();
    const workerUrl = `${workerBase.replace(/\/$/, "")}?token=${streamToken}`;

    // Fallback proxy Vercel local
    const streamUrl = `/api/stream/${access.trackId}`;

    let playUrl: string | null = null;
    if (fullAccess) {
      playUrl = await createPresignedGet({
        key,
        expiresIn,
        contentType: "audio/mpeg",
      });
    } else {
      // Pour les aperçus, l'URL Cloudflare Worker est le playUrl ultra-rapide
      playUrl = workerUrl;
    }

    return NextResponse.json(
      {
        playUrl,
        workerUrl,
        access: access.access,
        owned: access.owned,
        previewSeconds: PREVIEW_SECONDS,
        durationSeconds,
        trackId: access.trackId,
        releaseId: access.releaseId,
        expiresIn,
        streamUrl,
        /** worker = Cloudflare Edge (<50ms) ; signed = R2 direct */
        delivery: fullAccess ? "signed" : "worker",
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (e) {
    logServerError("api.stream.play", e);
    return NextResponse.json(
      { error: "Lecture impossible" },
      { status: 500 },
    );
  }
}

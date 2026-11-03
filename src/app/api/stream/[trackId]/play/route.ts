import { NextRequest, NextResponse } from "next/server";
import { getTrackPlaybackAccess } from "@/lib/audio/access";
import { PREVIEW_SECONDS } from "@/lib/audio/constants";
import { previewByteLimit } from "@/lib/audio/preview-bytes";
import { generateStreamToken, getWorkerBaseUrl } from "@/lib/audio/token";
import { extractR2KeyFromUrl } from "@/lib/r2";
import { createRequestClient } from "@/lib/supabase/request-client";
import { logServerError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ trackId: string }> };

/**
 * Métadonnées de lecture & génération de token Cloudflare Worker.
 * Ne jamais sonder R2 ici : la durée vient de la DB (ou null).
 * L’URL Worker est le chemin unique — pas d’URL R2 signée (CORS / ExoPlayer).
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { trackId } = await params;
    const supabase = await createRequestClient(request);
    const access = await getTrackPlaybackAccess(
      trackId,
      supabase,
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null,
    );

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

    const durationSeconds = access.durationSeconds ?? null;
    const fullAccess = access.access === "full";
    const expiresIn = fullAccess ? 7200 : 600;

    const maxBytes = fullAccess
      ? 1_000_000_000
      : previewByteLimit(null, durationSeconds);

    const streamToken = generateStreamToken(key, maxBytes, expiresIn);
    const workerBase = getWorkerBaseUrl();
    const workerUrl = `${workerBase.replace(/\/$/, "")}?token=${streamToken}`;
    const streamUrl = `/api/stream/${access.trackId}`;

    return NextResponse.json(
      {
        playUrl: workerUrl,
        workerUrl,
        access: access.access,
        owned: access.owned,
        previewSeconds: PREVIEW_SECONDS,
        durationSeconds,
        trackId: access.trackId,
        releaseId: access.releaseId,
        expiresIn,
        streamUrl,
        delivery: "worker",
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

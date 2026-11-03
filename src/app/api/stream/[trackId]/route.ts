import { NextRequest, NextResponse } from "next/server";
import { getTrackPlaybackAccess } from "@/lib/audio/access";
import { PREVIEW_SECONDS } from "@/lib/audio/constants";
import { previewByteLimit } from "@/lib/audio/preview-bytes";
import {
  extractR2KeyFromUrl,
  getObjectFromR2,
  headObjectFromR2,
} from "@/lib/r2";
import { createRequestClient } from "@/lib/supabase/request-client";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ trackId: string }> };

function secureHeaders(extra: HeadersInit = {}): HeadersInit {
  return {
    "Content-Type": "audio/mpeg",
    "Content-Disposition": "inline",
    "Cache-Control": "private, no-store, no-transform",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
    "Accept-Ranges": "bytes",
    ...extra,
  };
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

export async function GET(request: NextRequest, { params }: Params) {
  // ── Rate limiting : 120 requêtes/min par IP (chunked streaming compris) ──
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`stream:${ip}`, 120, 60_000);
  if (!rl.allowed) {
    return new NextResponse(null, {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        "X-RateLimit-Limit": "120",
        "X-RateLimit-Remaining": "0",
      },
    });
  }

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

  const fullAccess = access.access === "full";

  // Toujours HEAD pour un Content-Length / Content-Range cohérents
  // (ExoPlayer Android refuse les totaux absurdes type MAX_SAFE_INTEGER).
  let totalSize = 0;
  try {
    const head = await headObjectFromR2(key);
    totalSize = Number(head.ContentLength || 0);
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
  if (!totalSize) {
    return NextResponse.json({ error: "Fichier vide" }, { status: 404 });
  }

  // ── Limite octets : 20s d'aperçu si non propriétaire, totalité si plein accès ──
  const maxAllowed = fullAccess
    ? totalSize
    : previewByteLimit(totalSize, access.durationSeconds);

  const rangeHeader = request.headers.get("range");
  let start = 0;
  let end = maxAllowed - 1;

  if (rangeHeader) {
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    if (match) {
      if (match[1] !== undefined && match[1] !== "") start = Number(match[1]);
      if (match[2] !== undefined && match[2] !== "") end = Number(match[2]);
      else end = maxAllowed - 1;
    }

    if (start >= maxAllowed) {
      return new NextResponse(null, {
        status: 416,
        headers: secureHeaders({
          "Content-Range": `bytes */${maxAllowed}`,
          "X-Gootunes-Access": fullAccess ? "full" : "preview",
          "X-Gootunes-Preview-Seconds": String(PREVIEW_SECONDS),
        }),
      });
    }
    end = Math.min(end, maxAllowed - 1);
  } else {
    // 1re fenêtre courte pour un TTFB rapide.
    start = 0;
    end = Math.min(maxAllowed - 1, 256 * 1024 - 1);
  }

  start = Math.max(0, start);
  end = Math.max(start, Math.min(end, maxAllowed - 1));

  try {
    const object = await getObjectFromR2({
      key,
      range: `bytes=${start}-${end}`,
    });

    const body = object.Body;
    if (!body) {
      return NextResponse.json({ error: "Lecture impossible" }, { status: 500 });
    }

    const stream = body.transformToWebStream();
    const contentLength = end - start + 1;
    const isPartial = start > 0 || end < maxAllowed - 1;
    const status = isPartial ? 206 : 200;

    return new NextResponse(stream, {
      status,
      headers: secureHeaders({
        "Content-Length": String(contentLength),
        "Content-Range": `bytes ${start}-${end}/${maxAllowed}`,
        "X-Gootunes-Access": fullAccess ? "full" : "preview",
        "X-Gootunes-Preview-Seconds": String(PREVIEW_SECONDS),
        // Ne pas exposer owned : information sensible inutile côté client
      }),
    });
  } catch {
    return NextResponse.json({ error: "Stream impossible" }, { status: 500 });
  }
}

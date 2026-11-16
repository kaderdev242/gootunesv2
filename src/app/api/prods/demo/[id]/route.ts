import { NextRequest, NextResponse } from "next/server";
import { clientIpFromHeaders, checkRateLimit } from "@/lib/rate-limit";
import { getObjectFromR2, headObjectFromR2 } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function headers(extra: HeadersInit = {}): HeadersInit {
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

/**
 * Démo taguée d'une prod (aperçu public intégral, le tag protège le beat).
 * Servie en same-origin (comme /api/stream) : la clé R2 n'est jamais exposée.
 */
export async function GET(request: NextRequest, { params }: Params) {
  const ip = clientIpFromHeaders(request.headers);
  const rl = await checkRateLimit(`prods:demo:${ip}`, 120, 60_000);
  if (!rl.allowed) return new NextResponse(null, { status: 429 });

  const { id } = await params;
  const admin = createAdminClient();
  const { data: beat } = await admin
    .from("beats")
    .select("id, demo_key, status, is_hidden")
    .eq("public_id", id)
    .maybeSingle();
  if (!beat || beat.status !== "published" || beat.is_hidden) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  let total = 0;
  try {
    total = Number((await headObjectFromR2(beat.demo_key)).ContentLength || 0);
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
  if (!total) return NextResponse.json({ error: "Fichier vide" }, { status: 404 });

  const range = request.headers.get("range");
  let start = 0;
  let end = Math.min(total - 1, 256 * 1024 - 1);
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      start = m[1] ? Number(m[1]) : 0;
      end = m[2] ? Number(m[2]) : total - 1;
    }
    if (start >= total) {
      return new NextResponse(null, { status: 416, headers: headers({ "Content-Range": `bytes */${total}` }) });
    }
  }
  start = Math.max(0, start);
  end = Math.max(start, Math.min(end, total - 1));

  // Une écoute = une première requête depuis le début du fichier.
  if (start === 0) {
    const once = await checkRateLimit(`prods:play:${beat.id}:${ip}`, 1, 30 * 60_000);
    // La requête supabase-js n'est envoyée que si elle est attendue.
    if (once.allowed) {
      const { error } = await admin.rpc("increment_beat_plays", { p_beat_id: beat.id });
      if (error) console.error("[prods.demo] compteur d'écoutes", error.message);
    }
  }

  try {
    const object = await getObjectFromR2({ key: beat.demo_key, range: `bytes=${start}-${end}` });
    if (!object.Body) return NextResponse.json({ error: "Lecture impossible" }, { status: 500 });
    const partial = start > 0 || end < total - 1;
    return new NextResponse(object.Body.transformToWebStream(), {
      status: partial ? 206 : 200,
      headers: headers({
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${total}`,
      }),
    });
  } catch {
    return NextResponse.json({ error: "Lecture impossible" }, { status: 500 });
  }
}

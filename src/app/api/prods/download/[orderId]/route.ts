import { NextRequest, NextResponse } from "next/server";
import { logServerError } from "@/lib/errors";
import { LICENSES } from "@/lib/prods/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import { createPresignedGet } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRequestClient } from "@/lib/supabase/request-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ orderId: string }> };

const FILES = {
  mp3: { column: "mp3_key", type: "audio/mpeg", ext: "mp3" },
  wav: { column: "wav_key", type: "audio/wav", ext: "wav" },
  stems: { column: "stems_key", type: "application/zip", ext: "zip" },
} as const;

function safeName(s: string) {
  return s.normalize("NFD").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "_").slice(0, 60) || "prod";
}

/**
 * Téléchargement d'un livrable SANS tag, après achat confirmé.
 * Contrôles : acheteur connecté + commande `completed` + fichier inclus dans la licence.
 * Réponse : redirection vers une URL R2 signée valable 5 minutes.
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { orderId } = await params;
  const file = request.nextUrl.searchParams.get("file") as keyof typeof FILES | null;
  if (!file || !(file in FILES)) {
    return NextResponse.json({ error: "Fichier invalide" }, { status: 400 });
  }

  const supabase = await createRequestClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const rl = await checkRateLimit(`prods:dl:${user.id}`, 60, 60 * 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Trop de téléchargements" }, { status: 429 });

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("beat_orders")
    .select("buyer_id, status, license, beat_id, beats(title)")
    .eq("order_id", orderId)
    .maybeSingle();
  if (!order || order.buyer_id !== user.id || order.status !== "completed") {
    return NextResponse.json({ error: "Achat introuvable" }, { status: 404 });
  }
  if (!(LICENSES[order.license].files as readonly string[]).includes(file)) {
    return NextResponse.json({ error: "Non inclus dans ta licence" }, { status: 403 });
  }

  const { data: files } = await admin
    .from("beat_files")
    .select("mp3_key, wav_key, stems_key")
    .eq("beat_id", order.beat_id)
    .maybeSingle();
  const spec = FILES[file];
  const key = files?.[spec.column];
  if (!key) return NextResponse.json({ error: "Fichier non fourni par le beatmaker" }, { status: 404 });

  try {
    const title = (order.beats as { title?: string } | null)?.title || "prod";
    const url = await createPresignedGet({
      key,
      expiresIn: 300,
      contentType: spec.type,
      disposition: `attachment; filename="${safeName(title)}_${file}.${spec.ext}"`,
    });
    return NextResponse.redirect(url, 302);
  } catch (e) {
    logServerError("api.prods.download", e);
    return NextResponse.json({ error: "Téléchargement indisponible" }, { status: 500 });
  }
}

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  generateUploadToken,
  getUploadWorkerBaseUrl,
} from "@/lib/audio/upload-token";
import { logServerError, USER_ERRORS } from "@/lib/errors";
import { isFeatureEnabled } from "@/lib/features";
import { BEAT_FILE_TYPES, type BeatFileKind } from "@/lib/prods/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import { createRequestClient } from "@/lib/supabase/request-client";

const schema = z.object({
  kind: z.enum(["demo", "mp3", "wav", "stems"]),
  filename: z.string().min(1).max(200),
  size: z.number().int().positive(),
});

const EXT_OK: Record<BeatFileKind, RegExp> = {
  demo: /\.mp3$/i,
  mp3: /\.mp3$/i,
  wav: /\.wav$/i,
  stems: /\.zip$/i,
};

/**
 * Jeton d'envoi pour les fichiers de prods, via le Worker d'upload existant.
 * Clé imposée : audios/{uid}/prods/{uuid}.{ext} (le Worker exige le préfixe audios/{uid}/).
 * Le client ne reçoit que la clé : aucune URL publique n'est renvoyée.
 */
export async function POST(request: Request) {
  try {
    if (!(await isFeatureEnabled("prods"))) {
      return NextResponse.json({ error: "Fonctionnalité indisponible." }, { status: 404 });
    }

    const supabase = await createRequestClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "artist" && profile?.role !== "label") {
      return NextResponse.json({ error: "Réservé aux créateurs." }, { status: 403 });
    }

    const rl = await checkRateLimit(`prods:upload:${user.id}`, 40, 24 * 60 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: USER_ERRORS.rateLimit }, { status: 429 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }
    const { kind, filename, size } = parsed.data;
    const spec = BEAT_FILE_TYPES[kind];

    if (!EXT_OK[kind].test(filename)) {
      return NextResponse.json(
        { error: `Format attendu : ${spec.label}.` },
        { status: 400 },
      );
    }
    if (size > spec.maxBytes) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${Math.round(spec.maxBytes / 1024 / 1024)} Mo).` },
        { status: 400 },
      );
    }

    const key = `audios/${user.id}/prods/${randomUUID()}.${spec.ext}`;
    const token = generateUploadToken({
      userId: user.id,
      key,
      maxBytes: size,
      contentType: spec.contentType,
      expiresInSec: 1800,
    });
    const uploadUrl = `${getUploadWorkerBaseUrl().replace(/\/$/, "")}/?token=${encodeURIComponent(token)}`;
    return NextResponse.json({ uploadUrl, key, contentType: spec.contentType });
  } catch (e) {
    logServerError("api.prods.upload", e);
    return NextResponse.json({ error: USER_ERRORS.upload }, { status: 500 });
  }
}

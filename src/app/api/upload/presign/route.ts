import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  generateUploadToken,
  getUploadWorkerBaseUrl,
} from "@/lib/audio/upload-token";
import { logServerError, mapUploadError, USER_ERRORS } from "@/lib/errors";
import {
  checkRateLimit,
  clientIpFromHeaders,
} from "@/lib/rate-limit";
import { createPresignedUpload, publicFileUrl } from "@/lib/r2";
import { createRequestClient } from "@/lib/supabase/request-client";
import {
  MAX_AUDIO_BYTES,
  MAX_IMAGE_BYTES,
  presignUploadSchema,
} from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const supabase = await createRequestClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const ip = clientIpFromHeaders(request.headers);
    const [rlUser, rlIp] = await Promise.all([
      checkRateLimit(`upload:presign:user:${user.id}`, 20, 60 * 60_000),
      checkRateLimit(`upload:presign:ip:${ip}`, 40, 60 * 60_000),
    ]);
    if (!rlUser.allowed || !rlIp.allowed) {
      return NextResponse.json(
        { error: USER_ERRORS.rateLimit },
        { status: 429 },
      );
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const parsed = presignUploadSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Paramètres invalides" },
        { status: 400 },
      );
    }

    let { filename, contentType, kind, size } = parsed.data;

    if (kind === "audio") {
      if (size > MAX_AUDIO_BYTES) {
        return NextResponse.json(
          { error: "Fichier audio trop volumineux (max 50 Mo)" },
          { status: 400 },
        );
      }
      if (size <= 0) {
        return NextResponse.json(
          { error: "Taille de fichier invalide" },
          { status: 400 },
        );
      }
      const isMp3 =
        contentType === "audio/mpeg" ||
        contentType === "audio/mp3" ||
        filename.toLowerCase().endsWith(".mp3");
      if (!isMp3) {
        return NextResponse.json(
          { error: "Seuls les fichiers MP3 sont acceptés" },
          { status: 400 },
        );
      }
      contentType = "audio/mpeg";

      // Quota artiste : max 50 jetons audio / 24 h
      const rlDaily = await checkRateLimit(
        `upload:presign:day:${user.id}`,
        50,
        24 * 60 * 60_000,
      );
      if (!rlDaily.allowed) {
        return NextResponse.json(
          {
            error:
              "Quota d’uploads atteint pour aujourd’hui. Réessaie demain ou contacte le support.",
          },
          { status: 429 },
        );
      }

      // Clé imposée serveur — le client ne choisit rien
      const key = `audios/${user.id}/${randomUUID()}.mp3`;
      // maxBytes = taille déclarée (≤ 50 Mo) : Content-Length Worker doit respecter
      const token = generateUploadToken({
        userId: user.id,
        key,
        maxBytes: size,
        contentType,
        expiresInSec: 600,
      });
      const uploadUrl = `${getUploadWorkerBaseUrl().replace(/\/$/, "")}/?token=${encodeURIComponent(token)}`;
      return NextResponse.json({ uploadUrl, fileUrl: key, key });
    }

    if (size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image trop volumineuse (max 5 Mo)" },
        { status: 400 },
      );
    }
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Image requise" }, { status: 400 });
    }
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedImageTypes.includes(contentType)) {
      contentType = "image/jpeg";
    }

    const folder = kind === "avatar" ? "avatars" : `${kind}s`;
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${folder}/${user.id}/${Date.now()}-${safeName}`;

    const { uploadUrl } = await createPresignedUpload({ key, contentType });
    return NextResponse.json({
      uploadUrl,
      fileUrl: publicFileUrl(key),
      key,
    });
  } catch (e) {
    logServerError("api.upload.presign", e);
    return NextResponse.json(
      { error: mapUploadError(e) || USER_ERRORS.upload },
      { status: 500 },
    );
  }
}

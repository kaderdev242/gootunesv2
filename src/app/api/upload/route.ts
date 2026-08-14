import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logServerError, mapUploadError, USER_ERRORS } from "@/lib/errors";
import { uploadObjectToR2 } from "@/lib/r2";

type UploadKind = "cover" | "audio" | "avatar";

const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_AUDIO = 50 * 1024 * 1024;

/** Vérifie les magic bytes pour les images (JPEG, PNG, WebP, GIF). */
function isValidImageBuffer(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  // JPEG : FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG : 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  // GIF : 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true;
  // WebP : 52 49 46 46 ?? ?? ?? ?? 57 45 42 50
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf.length >= 12 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return true;
  return false;
}

/** Vérifie les magic bytes pour les fichiers MP3 (ID3 ou frame sync). */
function isValidAudioBuffer(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  // ID3 tag : 49 44 33
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true;
  // MP3 frame sync : FF Fx (FF FB, FF FA, FF F3, FF F2, FF FE, FF FD...)
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return true;
  return false;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const kindRaw = String(form.get("kind") || "cover");
    const kind: UploadKind =
      kindRaw === "audio" || kindRaw === "avatar" ? kindRaw : "cover";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

    const contentType = file.type || "application/octet-stream";
    const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    if ((kind === "cover" || kind === "avatar") && !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Image requise" }, { status: 400 });
    }
    if (kind === "audio") {
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
    }
    if ((kind === "cover" || kind === "avatar") && file.size > MAX_IMAGE) {
      return NextResponse.json({ error: "Image max 5 Mo" }, { status: 400 });
    }
    if (kind === "audio" && file.size > MAX_AUDIO) {
      return NextResponse.json({ error: "Audio max 50 Mo" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // ── Validation des magic bytes (protection contre les uploads déguisés) ──
    if (kind === "audio" && !isValidAudioBuffer(buffer)) {
      return NextResponse.json(
        { error: "Fichier invalide : le contenu ne correspond pas à un MP3" },
        { status: 400 },
      );
    }
    if ((kind === "cover" || kind === "avatar") && !isValidImageBuffer(buffer)) {
      return NextResponse.json(
        { error: "Fichier invalide : le contenu ne correspond pas à une image" },
        { status: 400 },
      );
    }

    const folder = kind === "avatar" ? "avatars" : `${kind}s`;
    const key = `${folder}/${user.id}/${Date.now()}-${filename}`;

    // Pour l'audio : on stocke la clé R2 directement (pas l'URL publique)
    // pour éviter tout accès direct au bucket.
    await uploadObjectToR2({ key, contentType, body: buffer });

    const fileUrl = kind === "audio"
      ? key  // Clé R2 pure — résolution côté serveur uniquement
      : `${(process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/$/, "")}/${key}`;

    return NextResponse.json({ key, fileUrl });
  } catch (e) {
    logServerError("api.upload", e);
    return NextResponse.json(
      { error: mapUploadError(e) || USER_ERRORS.upload },
      { status: 500 },
    );
  }
}

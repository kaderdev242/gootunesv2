import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logServerError, mapUploadError, USER_ERRORS } from "@/lib/errors";
import { createPresignedUpload, publicFileUrl } from "@/lib/r2";

type UploadKind = "cover" | "audio" | "avatar";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json()) as {
      filename?: string;
      contentType?: string;
      kind?: UploadKind;
    };

    const filename = body.filename?.replace(/[^a-zA-Z0-9._-]/g, "_");
    let contentType = body.contentType || "";
    const kind: UploadKind =
      body.kind === "audio" || body.kind === "avatar" ? body.kind : "cover";

    if (!filename) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
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
      contentType = "audio/mpeg";
    } else {
      if (!contentType.startsWith("image/")) {
        return NextResponse.json({ error: "Image requise" }, { status: 400 });
      }
      // Restreindre aux types d'images connus (anti content-type spoofing)
      const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedImageTypes.includes(contentType)) {
        contentType = "image/jpeg";
      }
    }

    const folder = kind === "avatar" ? "avatars" : `${kind}s`;
    const key = `${folder}/${user.id}/${Date.now()}-${filename}`;

    const { uploadUrl } = await createPresignedUpload({ key, contentType });

    // Pour l'audio : on retourne la clé R2 pure comme fileUrl (pas l'URL publique)
    // Le client la stockera en base — la résolution se fait côté serveur uniquement.
    const fileUrl = kind === "audio" ? key : publicFileUrl(key);

    return NextResponse.json({ uploadUrl, fileUrl, key });
  } catch (e) {
    logServerError("api.upload.presign", e);
    return NextResponse.json(
      { error: mapUploadError(e) || USER_ERRORS.upload },
      { status: 500 },
    );
  }
}

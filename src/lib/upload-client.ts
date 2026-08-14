import { compressImageFile } from "@/lib/compress-image";
import { mapUploadError, USER_ERRORS } from "@/lib/errors";

export type UploadKind = "cover" | "audio" | "avatar";

const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_AUDIO = 50 * 1024 * 1024;

function resolveContentType(file: File, kind: UploadKind): string {
  const name = file.name.toLowerCase();
  if (kind === "audio") {
    if (
      file.type === "audio/mpeg" ||
      file.type === "audio/mp3" ||
      name.endsWith(".mp3")
    ) {
      return "audio/mpeg";
    }
    return file.type || "audio/mpeg";
  }
  if (file.type.startsWith("image/")) return file.type;
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  return file.type || "image/jpeg";
}

function assertClientFile(file: File, kind: UploadKind) {
  if (kind === "audio") {
    const ok =
      file.type === "audio/mpeg" ||
      file.type === "audio/mp3" ||
      file.name.toLowerCase().endsWith(".mp3");
    if (!ok) throw new Error("Seuls les fichiers MP3 sont acceptés.");
    if (file.size > MAX_AUDIO) {
      throw new Error("Audio trop volumineux (max 50 Mo).");
    }
    return;
  }
  if (
    !file.type.startsWith("image/") &&
    !/\.(jpe?g|png|webp|gif)$/i.test(file.name)
  ) {
    throw new Error("Image requise.");
  }
  if (file.size > MAX_IMAGE) {
    throw new Error("Image trop volumineuse (max 5 Mo après compression).");
  }
}

/**
 * Upload navigateur → R2 via URL présignée.
 * Images (avatar / cover) : compression JPEG avant envoi.
 */
export async function uploadViaApi(file: File, kind: UploadKind) {
  let payload = file;

  if (kind === "avatar" || kind === "cover") {
    payload = await compressImageFile(file, kind);
  }

  assertClientFile(payload, kind);
  const contentType = resolveContentType(payload, kind);
  const filename = payload.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  let presignRes: Response;
  try {
    presignRes = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, contentType, kind }),
    });
  } catch {
    throw new Error(USER_ERRORS.network);
  }

  const presignRaw = await presignRes.text();
  let presign: {
    uploadUrl?: string;
    fileUrl?: string;
    key?: string;
    error?: string;
  } = {};
  try {
    presign = JSON.parse(presignRaw) as typeof presign;
  } catch {
    throw new Error(USER_ERRORS.upload);
  }

  if (!presignRes.ok || !presign.uploadUrl || !presign.fileUrl) {
    throw new Error(mapUploadError(presign.error || USER_ERRORS.upload));
  }

  let putRes: Response;
  try {
    putRes = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: payload,
    });
  } catch {
    throw new Error(
      "Upload bloqué (réseau ou CORS R2). Vérifie la config du bucket.",
    );
  }

  if (!putRes.ok) {
    const detail = await putRes.text().catch(() => "");
    console.error("[upload.r2]", putRes.status, detail.slice(0, 300));
    throw new Error(
      putRes.status === 403
        ? "Accès stockage refusé. Vérifie les clés R2 et le CORS du bucket."
        : USER_ERRORS.upload,
    );
  }

  return presign.fileUrl;
}

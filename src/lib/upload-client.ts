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

/** Images : POST same-origin (évite CORS R2). Limite Vercel OK (< 5 Mo). */
async function uploadImageViaServer(
  file: File,
  kind: "cover" | "avatar",
): Promise<{ fileUrl: string; durationSeconds: null }> {
  const form = new FormData();
  form.set("file", file);
  form.set("kind", kind);

  let res: Response;
  try {
    res = await fetch("/api/upload", { method: "POST", body: form });
  } catch {
    throw new Error(USER_ERRORS.network);
  }

  const raw = await res.text();
  let data: { fileUrl?: string; error?: string } = {};
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    throw new Error(USER_ERRORS.upload);
  }

  if (!res.ok || !data.fileUrl) {
    throw new Error(mapUploadError(data.error || USER_ERRORS.upload));
  }

  return { fileUrl: data.fileUrl, durationSeconds: null };
}

export type UploadProgress = (percent: number) => void;

/** PUT avec progression (fetch n’expose pas upload.progress). */
function putWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress?: UploadProgress,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (ev) => {
      if (!onProgress || !ev.lengthComputable || ev.total <= 0) return;
      onProgress(Math.min(100, Math.round((ev.loaded / ev.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      console.error("[upload.worker]", xhr.status, xhr.responseText.slice(0, 300));
      reject(
        new Error(
          xhr.status === 403
            ? "Envoi du fichier audio refusé. Réessaie dans un instant, ou contacte le support si ça continue."
            : USER_ERRORS.upload,
        ),
      );
    };
    xhr.onerror = () =>
      reject(
        new Error(
          "Impossible d’envoyer le fichier audio. Vérifie ta connexion internet, puis réessaie.",
        ),
      );
    xhr.onabort = () => reject(new Error(USER_ERRORS.upload));
    xhr.send(file);
  });
}

/**
 * Audio : PUT via Worker Cloudflare (binding R2).
 * Évite le hostname S3 R2, souvent irrésolvable sur certains réseaux mobiles.
 */
async function uploadAudioViaPresign(
  file: File,
  onProgress?: UploadProgress,
): Promise<{ fileUrl: string; durationSeconds: number | null }> {
  const contentType = resolveContentType(file, "audio");
  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  let presignRes: Response;
  try {
    presignRes = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename,
        contentType,
        kind: "audio",
        size: file.size,
      }),
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

  onProgress?.(0);
  await putWithProgress(presign.uploadUrl, file, contentType, onProgress);

  let durationSeconds: number | null = null;
  if (presign.key) {
    try {
      const metaRes = await fetch("/api/upload/audio-duration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: presign.key }),
      });
      if (metaRes.ok) {
        const meta = (await metaRes.json()) as {
          durationSeconds?: number | null;
        };
        if (
          typeof meta.durationSeconds === "number" &&
          meta.durationSeconds > 0
        ) {
          durationSeconds = Math.round(meta.durationSeconds);
        }
      }
    } catch {
      // Durée optionnelle
    }
  }

  return { fileUrl: presign.fileUrl, durationSeconds };
}

/**
 * Upload navigateur.
 * - avatar / cover → `/api/upload` (same-origin)
 * - audio → Worker Cloudflare (gros fichiers, sans DNS R2 côté client)
 */
export async function uploadViaApi(
  file: File,
  kind: UploadKind,
  onProgress?: UploadProgress,
): Promise<{ fileUrl: string; durationSeconds: number | null }> {
  let payload = file;

  if (kind === "avatar" || kind === "cover") {
    payload = await compressImageFile(file, kind);
  }

  assertClientFile(payload, kind);

  if (kind === "avatar" || kind === "cover") {
    return uploadImageViaServer(payload, kind);
  }

  return uploadAudioViaPresign(payload, onProgress);
}

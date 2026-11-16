import { mapUploadError, USER_ERRORS } from "@/lib/errors";
import { BEAT_FILE_TYPES, type BeatFileKind } from "@/lib/prods/constants";

/** Envoie un fichier de prod (démo, MP3, WAV, stems) via le Worker et renvoie sa clé R2. */
export async function uploadBeatFile(
  file: File,
  kind: BeatFileKind,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const spec = BEAT_FILE_TYPES[kind];
  if (file.size > spec.maxBytes) {
    throw new Error(`Fichier trop volumineux (max ${Math.round(spec.maxBytes / 1024 / 1024)} Mo).`);
  }

  let res: Response;
  try {
    res = await fetch("/api/prods/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, filename: file.name, size: file.size }),
    });
  } catch {
    throw new Error(USER_ERRORS.network);
  }
  const data = (await res.json().catch(() => ({}))) as {
    uploadUrl?: string;
    key?: string;
    contentType?: string;
    error?: string;
  };
  if (!res.ok || !data.uploadUrl || !data.key || !data.contentType) {
    throw new Error(mapUploadError(data.error || USER_ERRORS.upload));
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", data.uploadUrl!);
    xhr.setRequestHeader("Content-Type", data.contentType!);
    xhr.upload.onprogress = (ev) => {
      if (onProgress && ev.lengthComputable && ev.total > 0) {
        onProgress(Math.min(100, Math.round((ev.loaded / ev.total) * 100)));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? (onProgress?.(100), resolve())
        : reject(new Error(USER_ERRORS.upload));
    xhr.onerror = () =>
      reject(new Error("Impossible d’envoyer le fichier. Vérifie ta connexion internet, puis réessaie."));
    xhr.onabort = () => reject(new Error(USER_ERRORS.upload));
    xhr.send(file);
  });

  return data.key;
}

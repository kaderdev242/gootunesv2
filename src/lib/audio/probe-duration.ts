import { parseBuffer } from "music-metadata";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  extractR2KeyFromUrl,
  getObjectFromR2,
  headObjectFromR2,
} from "@/lib/r2";
import { logServerError } from "@/lib/errors";

function roundDuration(seconds: number | undefined): number | null {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.max(1, Math.round(seconds));
}

/**
 * Durée depuis un buffer déjà en mémoire (upload proxy).
 * Passe la taille réelle du fichier à music-metadata (CBR).
 */
export async function probeDurationFromBuffer(
  buffer: Buffer,
  mimeType = "audio/mpeg",
): Promise<number | null> {
  try {
    const fileSize = buffer.length;
    if (fileSize <= 0) return null;
    const slice =
      fileSize < 8_000_000 ? buffer : buffer.subarray(0, 1_048_576);
    const meta = await parseBuffer(
      slice,
      { mimeType, size: fileSize },
      { duration: true },
    );
    return roundDuration(meta.format.duration);
  } catch (e) {
    logServerError("audio.probeDuration.buffer", e);
    return null;
  }
}

/**
 * Lit la durée MP3 depuis R2.
 * Important : passer la taille réelle du fichier à music-metadata
 * (pas la taille du buffer partiel), sinon sous-estimation CBR.
 */
export async function probeDurationFromR2Key(key: string): Promise<number | null> {
  try {
    const head = await headObjectFromR2(key);
    const fileSize = head.ContentLength;
    if (!fileSize || fileSize <= 0) return null;

    // Fichiers < 8 Mo : lire tout. Sinon 1 Mo (Xing/LAME + estimation via size).
    const end =
      fileSize < 8_000_000
        ? fileSize - 1
        : Math.min(fileSize - 1, 1_048_575);

    const object = await getObjectFromR2({
      key,
      range: `bytes=0-${end}`,
    });
    const body = object.Body;
    if (!body) return null;

    const bytes = await body.transformToByteArray();
    const meta = await parseBuffer(
      Buffer.from(bytes),
      { mimeType: "audio/mpeg", size: fileSize },
      { duration: true },
    );
    return roundDuration(meta.format.duration);
  } catch (e) {
    logServerError("audio.probeDuration", e);
    return null;
  }
}

/**
 * Si `duration_seconds` est vide, la calcule depuis R2 et met à jour la DB.
 * Retourne la durée (existante ou nouvellement écrite).
 */
export async function ensureTrackDurationSeconds(input: {
  trackId: string;
  audioUrl: string;
  currentDuration: number | null | undefined;
}): Promise<number | null> {
  if (
    input.currentDuration != null &&
    Number.isFinite(input.currentDuration) &&
    input.currentDuration > 0
  ) {
    return Math.round(input.currentDuration);
  }

  const key = extractR2KeyFromUrl(input.audioUrl);
  if (!key) return null;

  const probed = await probeDurationFromR2Key(key);
  if (!probed) return null;

  try {
    const admin = createAdminClient();
    // Remplace null et 0 (anciennes pistes sans durée capturée à l’upload).
    const { error } = await admin
      .from("tracks")
      .update({ duration_seconds: probed })
      .eq("id", input.trackId)
      .or("duration_seconds.is.null,duration_seconds.eq.0");
    if (error) {
      logServerError("audio.ensureDuration.update", error, {
        trackId: input.trackId,
        probed,
      });
    }
  } catch (e) {
    logServerError("audio.ensureDuration.update", e, {
      trackId: input.trackId,
      probed,
    });
  }

  return probed;
}

import {
  PREVIEW_FALLBACK_BITRATE_KBPS,
  PREVIEW_SECONDS,
} from "@/lib/audio/constants";

/** Plafond absolu ≈ 20s à 320 kbps (+ marge en-tête MP3). */
const PREVIEW_MAX_BITRATE_KBPS = 320;

/**
 * Borne octets pour l’aperçu.
 * Toujours plafonnée pour qu’un bitrate élevé / durée DB fausse
 * ne laisse pas passer plus de ~20 secondes d’audio.
 */
export function previewByteLimit(
  totalSize: number | null | undefined,
  durationSeconds: number | null | undefined,
): number {
  const absoluteMax =
    Math.ceil((PREVIEW_MAX_BITRATE_KBPS * 1000 * PREVIEW_SECONDS) / 8) +
    32 * 1024;

  const fallback =
    Math.ceil((PREVIEW_FALLBACK_BITRATE_KBPS * 1000 * PREVIEW_SECONDS) / 8) +
    32 * 1024;

  const size =
    totalSize && Number.isFinite(totalSize) && totalSize > 0
      ? totalSize
      : null;

  const duration =
    durationSeconds && durationSeconds > 0 ? durationSeconds : null;

  let estimated = fallback;
  if (size && duration) {
    estimated = Math.ceil((size / duration) * PREVIEW_SECONDS);
  } else if (size) {
    estimated = Math.min(size, fallback);
  }

  if (size) {
    return Math.min(size, estimated, absoluteMax);
  }
  return Math.min(estimated, absoluteMax);
}

export { PREVIEW_SECONDS };

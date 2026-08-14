"use client";

import { formatDuration } from "@/lib/format";

/** Affiche uniquement la durée stockée en base (pas d'appel stream). */
export function TrackDuration({
  seconds,
  className = "text-sm text-white/40",
}: {
  seconds?: number | null;
  /** @deprecated ignoré — ne plus charger /api/stream pour les métadonnées */
  audioUrl?: string | null;
  className?: string;
}) {
  return (
    <span className={className}>
      {formatDuration(seconds && seconds > 0 ? seconds : null)}
    </span>
  );
}

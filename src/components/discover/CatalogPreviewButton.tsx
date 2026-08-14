"use client";

import { Button } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { usePlayer } from "@/components/feed/PlayerProvider";
import type { Track } from "@/lib/types/music";
import { trackStreamUrl } from "@/lib/types/music";

export function CatalogPreviewButton({
  track,
}: {
  track: Track;
}) {
  const { current, isPlaying, playTrack, togglePlay } = usePlayer();
  const active = current?.id === track.id;
  const playing = active && isPlaying;

  return (
    <Button
      type="button"
      variant="ghost"
      onPress={() => {
        if (active) togglePlay();
        else
          void playTrack({
            ...track,
            audioUrl: trackStreamUrl(track.id),
          });
      }}
      className="h-10 rounded-full border border-white/12 bg-white/5 px-3 text-white"
      aria-label={playing ? "Pause" : "Écouter un aperçu"}
    >
      <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={16} />
      <span className="ml-1.5 text-xs">
        {playing ? "Pause" : "Aperçu 20s"}
      </span>
    </Button>
  );
}

"use client";

import { Button } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { usePlayer } from "@/components/feed/PlayerProvider";
import type { Track } from "@/lib/types/music";

export function ReleaseTrackPlayButton({
  track,
  queue,
}: {
  track: Track;
  queue?: Track[];
}) {
  const { current, isPlaying, playTrack, togglePlay } = usePlayer();
  const active = current?.id === track.id;
  const playing = active && isPlaying;

  return (
    <Button
      type="button"
      isIconOnly
      variant="ghost"
      className="text-white/70"
      aria-label={playing ? "Pause" : `Écouter ${track.title}`}
      onPress={() => {
        if (active) togglePlay();
        else void playTrack(track, queue);
      }}
    >
      <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={16} />
    </Button>
  );
}

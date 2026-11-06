"use client";

import { Button } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import type { Track } from "@/lib/types/music";
import { usePlayer } from "@/components/feed/PlayerProvider";

export function ArtistHeroPlayButton({ tracks }: { tracks: Track[] }) {
  const { current, isPlaying, playTrack, togglePlay } = usePlayer();
  const first = tracks[0];
  if (!first) return null;

  const playingHere =
    !!current && isPlaying && tracks.some((t) => t.id === current.id);

  return (
    <Button
      type="button"
      isIconOnly
      aria-label={playingHere ? "Pause" : "Lecture"}
      onPress={() => {
        if (playingHere) togglePlay();
        else playTrack(first, tracks);
      }}
      className="size-14 rounded-full bg-white text-black shadow-lg shadow-black/40 transition-[background-color,transform] duration-150 hover:bg-white/90 active:scale-[0.97]"
    >
      <HugeiconsIcon icon={playingHere ? PauseIcon : PlayIcon} size={28} />
    </Button>
  );
}

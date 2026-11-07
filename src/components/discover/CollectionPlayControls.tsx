"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { PauseIcon, PlayIcon, ShuffleIcon } from "@hugeicons/core-free-icons";
import { usePlayer } from "@/components/feed/PlayerProvider";
import type { Track } from "@/lib/types/music";
import { IconAction } from "./IconAction";

function shuffledQueue(tracks: Track[]) {
  const next = [...tracks];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = next[i];
    next[i] = next[j]!;
    next[j] = current!;
  }
  return next;
}

export function CollectionPlayControls({
  tracks,
}: {
  tracks: Track[];
  /** Conservé pour compatibilité : l'aléatoire est désormais une action en icône. */
  showShuffle?: boolean;
}) {
  const { current, isPlaying, playTrack, togglePlay } = usePlayer();
  const first = tracks[0];
  if (!first) return null;

  const playingHere =
    !!current && isPlaying && tracks.some((t) => t.id === current.id);

  return (
    <button
      type="button"
      onClick={() => {
        if (playingHere) togglePlay();
        else void playTrack(first, tracks);
      }}
      className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-black transition-[background-color,transform] duration-150 hover:bg-white/90 active:scale-[0.97]"
    >
      <HugeiconsIcon
        icon={playingHere ? PauseIcon : PlayIcon}
        size={18}
        strokeWidth={2}
      />
      {playingHere ? "Pause" : "Lire"}
    </button>
  );
}

/** Action « Aléatoire » : lance la collection dans un ordre mélangé. */
export function ShuffleAction({ tracks }: { tracks: Track[] }) {
  const { playTrack } = usePlayer();
  if (!tracks.length) return null;
  // Masqué sur mobile, comme Crédits et Partager.
  return (
    <div className="hidden sm:block">
      <IconAction
        icon={ShuffleIcon}
        label="Aléatoire"
        onClick={() => {
          const queue = shuffledQueue(tracks);
          const start = queue[0];
          if (start) void playTrack(start, queue);
        }}
      />
    </div>
  );
}

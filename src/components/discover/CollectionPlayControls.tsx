"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { PauseIcon, PlayIcon, ShuffleIcon } from "@hugeicons/core-free-icons";
import { usePlayer } from "@/components/feed/PlayerProvider";
import type { Track } from "@/lib/types/music";

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
  showShuffle = false,
}: {
  tracks: Track[];
  /** Uniquement albums (pas les singles / titres). */
  showShuffle?: boolean;
}) {
  const { current, isPlaying, playTrack, togglePlay } = usePlayer();
  const first = tracks[0];
  if (!first) return null;

  const playingHere =
    !!current && isPlaying && tracks.some((t) => t.id === current.id);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => {
          if (playingHere) togglePlay();
          else void playTrack(first, tracks);
        }}
        className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-black transition hover:bg-white/90"
      >
        <HugeiconsIcon icon={playingHere ? PauseIcon : PlayIcon} size={18} />
        {playingHere ? "Pause" : "Lire"}
      </button>
      {showShuffle ? (
        <button
          type="button"
          onClick={() => {
            const queue = shuffledQueue(tracks);
            const start = queue[0];
            if (start) void playTrack(start, queue);
          }}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-white/10 px-6 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
        >
          <HugeiconsIcon icon={ShuffleIcon} size={16} />
          Aléatoire
        </button>
      ) : null}
    </div>
  );
}

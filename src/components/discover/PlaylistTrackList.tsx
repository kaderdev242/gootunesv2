"use client";

import Image from "next/image";
import { useActionState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, PlayIcon } from "@hugeicons/core-free-icons";
import { removeTrackFromPlaylist } from "@/lib/actions/playlists";
import type { ActionState } from "@/lib/actions/profile";
import { useActionToast } from "@/hooks/useActionToast";
import { usePlayer } from "@/components/feed/PlayerProvider";
import { FALLBACK_COVER, type Track } from "@/lib/types/music";
import { TrackDuration } from "./TrackDuration";

const initial: ActionState = {};

export function PlaylistTrackList({
  playlistId,
  tracks,
}: {
  playlistId: string;
  tracks: Track[];
}) {
  const { playTrack, current, isPlaying } = usePlayer();
  const [state, action, pending] = useActionState(
    removeTrackFromPlaylist,
    initial,
  );
  useActionToast(state);

  if (!tracks.length) {
    return (
      <p className="text-sm text-white/40">
        Playlist vide. Ajoute des morceaux depuis une page de sortie.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {tracks.map((track, index) => {
        const active = current?.id === track.id;
        return (
          <div
            key={track.id}
            className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-white/5"
          >
            <span className="w-6 text-sm text-white/35">
              {String(index + 1).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => playTrack(track, tracks)}
              className="relative size-10 shrink-0 overflow-hidden rounded-lg"
              aria-label={`Lecture ${track.title}`}
            >
              <Image
                src={track.cover || FALLBACK_COVER}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
              <span className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 transition hover:opacity-100">
                <HugeiconsIcon
                  icon={PlayIcon}
                  size={14}
                  className="text-white"
                />
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-medium ${
                  active && isPlaying ? "text-emerald-300" : "text-white"
                }`}
              >
                {track.title}
              </p>
              <p className="truncate text-xs text-white/40">{track.artist}</p>
            </div>
            <TrackDuration
              seconds={track.durationSeconds}
              className="hidden shrink-0 text-sm tabular-nums text-white/40 sm:inline"
            />
            <form action={action}>
              <input type="hidden" name="playlist_id" value={playlistId} />
              <input type="hidden" name="track_id" value={track.id} />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex size-9 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                aria-label="Retirer de la playlist"
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} />
              </button>
            </form>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  FavouriteIcon,
  PauseIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { NowPlayingBars } from "@/components/discover/NowPlayingBars";
import { AppImage } from "@/components/media/AppImage";
import {
  TrackArtistLine,
  TrackTitleLine,
} from "@/components/discover/ExplicitBadge";
import { TrackDuration } from "@/components/discover/TrackDuration";
import { PreloadOnVisible } from "@/components/feed/PreloadOnVisible";
import { usePlayer } from "@/components/feed/PlayerProvider";
import { FALLBACK_COVER, type Track } from "@/lib/types/music";

export function DetailTrackTable({
  tracks,
  showCover = false,
  emptyLabel = "Aucun morceau.",
  rowActions,
}: {
  tracks: Track[];
  showCover?: boolean;
  emptyLabel?: string;
  rowActions?: (track: Track) => ReactNode;
}) {
  const { current, isPlaying, playTrack, togglePlay, toggleLike, isLiked } =
    usePlayer();

  if (!tracks.length) {
    return <p className="px-2 py-8 text-sm text-white/40">{emptyLabel}</p>;
  }

  return (
    <div>
      <div
        className={`mb-2 hidden items-center gap-3 border-b border-white/10 px-2 pb-3 text-[12px] font-medium text-white/35 sm:grid ${
          showCover
            ? "grid-cols-[2.25rem_minmax(0,1.6fr)_minmax(0,1fr)_4.5rem_auto]"
            : "grid-cols-[2.25rem_minmax(0,1.6fr)_minmax(0,1fr)_4.5rem_auto]"
        }`}
      >
        <span className="text-center">#</span>
        <span>Titre</span>
        <span>Artiste</span>
        <span className="flex justify-end">
          <HugeiconsIcon icon={Clock01Icon} size={14} />
          <span className="sr-only">Durée</span>
        </span>
        <span className="w-[5.5rem]" />
      </div>

      <div className="flex flex-col">
        {tracks.map((track, index) => {
          const active = current?.id === track.id;
          const playing = active && isPlaying;
          const liked = isLiked(track.id);
          const artistHref =
            track.artistPublicId || track.artistId
              ? `/discover/artiste/${track.artistPublicId || track.artistId}`
              : null;

          return (
            <PreloadOnVisible key={`${track.id}-${index}`} trackId={track.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (active) togglePlay();
                  else void playTrack(track, tracks);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (active) togglePlay();
                    else void playTrack(track, tracks);
                  }
                }}
                className={`group grid cursor-pointer items-center gap-2 rounded-md px-2 py-2.5 text-left transition sm:gap-3 ${
                  showCover
                    ? "grid-cols-[2.25rem_minmax(0,1fr)_auto] sm:grid-cols-[2.25rem_minmax(0,1.6fr)_minmax(0,1fr)_4.5rem_auto]"
                    : "grid-cols-[2.25rem_minmax(0,1fr)_auto] sm:grid-cols-[2.25rem_minmax(0,1.6fr)_minmax(0,1fr)_4.5rem_auto]"
                } ${active ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"}`}
              >
                <span className="relative grid size-8 place-items-center justify-self-center text-sm tabular-nums text-white/35">
                  <span className={playing || active ? "sm:hidden" : "group-hover:hidden"}>
                    {index + 1}
                  </span>
                  {playing ? (
                    <span className="grid place-items-center group-hover:hidden">
                      <NowPlayingBars />
                    </span>
                  ) : null}
                  <span
                    className={`${
                      playing
                        ? "hidden group-hover:grid"
                        : active
                          ? "grid"
                          : "hidden group-hover:grid"
                    } place-items-center text-white`}
                  >
                    <HugeiconsIcon
                      icon={playing ? PauseIcon : PlayIcon}
                      size={14}
                    />
                  </span>
                </span>

                <div className="flex min-w-0 items-center gap-3">
                  {showCover ? (
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-sm bg-zinc-900 ring-1 ring-white/8">
                      <AppImage
                        src={track.cover || FALLBACK_COVER}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </span>
                  ) : null}
                  <div className="min-w-0">
                    <TrackTitleLine
                      title={track.title}
                      explicit={track.explicit}
                      className={`truncate text-sm font-medium ${
                        active ? "text-violet-300" : "text-white/95"
                      }`}
                    />
                    <span className="sm:hidden">
                      <TrackArtistLine artist={track.artist} />
                    </span>
                  </div>
                </div>

                <span className="hidden min-w-0 sm:block">
                  {artistHref ? (
                    <Link
                      href={artistHref}
                      onClick={(e) => e.stopPropagation()}
                      className="block min-w-0 text-sm text-white/55 transition hover:text-white hover:underline"
                    >
                      <TrackArtistLine
                        artist={track.artist}
                        className="text-sm text-inherit"
                      />
                    </Link>
                  ) : (
                    <TrackArtistLine
                      artist={track.artist}
                      className="text-sm text-white/55"
                    />
                  )}
                </span>

                <TrackDuration
                  seconds={
                    track.durationSeconds > 0 ? track.durationSeconds : null
                  }
                  className="hidden text-right text-sm tabular-nums text-white/40 sm:block"
                />

                <div
                  className="flex items-center justify-end gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <TrackDuration
                    seconds={
                      track.durationSeconds > 0 ? track.durationSeconds : null
                    }
                    className="mr-1 text-sm tabular-nums text-white/40 sm:hidden"
                  />
                  <button
                    type="button"
                    onClick={() => toggleLike(track.id)}
                    className={`grid size-9 place-items-center rounded-full transition hover:bg-white/10 ${
                      liked ? "text-white" : "text-white/30"
                    }`}
                    aria-label={
                      liked ? "Retirer des favoris" : "Ajouter aux favoris"
                    }
                  >
                    <HugeiconsIcon icon={FavouriteIcon} size={16} />
                  </button>
                  {rowActions?.(track)}
                </div>
              </div>
            </PreloadOnVisible>
          );
        })}
      </div>
    </div>
  );
}

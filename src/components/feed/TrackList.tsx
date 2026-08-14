"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon, PlayIcon } from "@hugeicons/core-free-icons";
import type { Track } from "@/lib/types/music";
import { TrackDuration } from "@/components/discover/TrackDuration";
import { TrackArtistLine } from "@/components/discover/ExplicitBadge";
import { usePlayer } from "./PlayerProvider";
import { PreloadOnVisible } from "./PreloadOnVisible";

type TrackListProps = {
  tracks: Track[];
  title?: string;
  emptyLabel?: string;
};

export function TrackList({
  tracks,
  title = "Écoutés récemment",
  emptyLabel = "Aucune sortie pour le moment.",
}: TrackListProps) {
  const router = useRouter();
  const { playTrack, toggleLike, isLiked, current } = usePlayer();

  return (
    <section>
      <h2 className="font-display mb-4 text-2xl font-bold text-white">{title}</h2>
      {tracks.length === 0 ? (
        <p className="text-sm text-white/40">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-1">
          {tracks.map((track, index) => {
            const liked = isLiked(track.id);
            const active = current?.id === track.id;
            const href =
              track.releasePublicId || track.releaseId
                ? `/discover/release/${track.releasePublicId || track.releaseId}`
                : null;

            return (
              <PreloadOnVisible key={`${track.id}-${index}`} trackId={track.id}>
              <div
                role={href ? "link" : "button"}
                tabIndex={0}
                onClick={() => {
                  if (href) router.push(href);
                  else void playTrack(track, tracks);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (href) router.push(href);
                    else void playTrack(track, tracks);
                  }
                }}
                className={`group grid w-full cursor-pointer grid-cols-[36px_minmax(0,1fr)_52px_36px_36px] items-center gap-2 rounded-2xl px-2 py-2.5 text-left transition sm:grid-cols-[40px_minmax(0,1.4fr)_minmax(0,1fr)_56px_40px_40px] sm:gap-3 sm:px-3 ${
                  active ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <span className="relative flex size-8 items-center justify-center text-sm text-white/35">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={track.cover}
                      alt={track.title}
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`truncate text-sm font-semibold ${
                        active ? "text-white" : "text-white/90"
                      }`}
                    >
                      {track.title}
                    </p>
                    {track.artistPublicId || track.artistId ? (
                      <Link
                        href={`/discover/artiste/${track.artistPublicId || track.artistId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-white/40 hover:text-white/70"
                      >
                        <TrackArtistLine
                          artist={track.artist}
                          explicit={track.explicit}
                          className="text-xs"
                        />
                      </Link>
                    ) : (
                      <TrackArtistLine
                        artist={track.artist}
                        explicit={track.explicit}
                      />
                    )}
                  </div>
                </div>

                <p className="hidden truncate text-sm text-white/40 sm:block">
                  {track.album}
                </p>
                <TrackDuration
                  seconds={
                    track.durationSeconds > 0
                      ? track.durationSeconds
                      : null
                  }
                  audioUrl={track.audioUrl}
                  className="text-right text-xs tabular-nums text-white/40 sm:text-sm"
                />

                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    void playTrack(track, tracks);
                  }}
                  aria-label={`Écouter ${track.title}`}
                >
                  <HugeiconsIcon icon={PlayIcon} size={14} />
                </button>

                <button
                  type="button"
                  className={`grid size-8 place-items-center rounded-full transition hover:bg-white/10 ${
                    liked ? "text-white" : "text-white/30"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(track.id);
                  }}
                  aria-label="Ajouter aux favoris"
                >
                  <HugeiconsIcon icon={FavouriteIcon} size={16} />
                </button>
              </div>
              </PreloadOnVisible>
            );
          })}
        </div>
      )}
    </section>
  );
}

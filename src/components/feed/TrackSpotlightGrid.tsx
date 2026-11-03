"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import type { Track } from "@/lib/types/music";
import { LazyCover } from "@/components/discover/LazyCover";
import {
  TrackArtistLine,
  TrackTitleLine,
} from "@/components/discover/ExplicitBadge";
import { usePlayer } from "./PlayerProvider";
import { PreloadOnVisible } from "./PreloadOnVisible";

export function TrackSpotlightGrid({
  title,
  subtitle,
  tracks,
  seeAllHref,
  emptyLabel = "Rien à afficher pour le moment.",
}: {
  title: string;
  subtitle?: string;
  tracks: Track[];
  seeAllHref?: string;
  emptyLabel?: string;
}) {
  const router = useRouter();
  const { playTrack, current } = usePlayer();

  return (
    <section>
      <div className="mb-4 flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.375rem] font-bold tracking-tight text-white">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-white/40">{subtitle}</p>
          ) : null}
        </div>
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="shrink-0 text-sm font-medium text-white/45 transition hover:text-white"
          >
            Tout voir
          </Link>
        ) : null}
      </div>

      {tracks.length === 0 ? (
        <p className="text-sm text-white/40">{emptyLabel}</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2 xl:grid-cols-3">
          {tracks.map((track) => {
            const href =
              track.releasePublicId || track.releaseId
                ? `/discover/release/${track.releasePublicId || track.releaseId}`
                : null;
            const active = current?.id === track.id;

            return (
              <PreloadOnVisible key={track.id} trackId={track.id}>
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
                  className={`group flex cursor-pointer items-center gap-3 rounded-md px-1 py-2 text-left transition ${
                    active ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
                  }`}
                >
                  <LazyCover
                    src={track.cover}
                    alt={track.title}
                    sizes="48px"
                    className="size-12 shrink-0 rounded-md"
                  />
                  <div className="min-w-0 flex-1">
                    <TrackTitleLine
                      title={track.title}
                      explicit={track.explicit}
                      className={`truncate text-sm font-medium ${
                        active ? "text-white" : "text-white/90"
                      }`}
                    />
                    {track.artistPublicId || track.artistId ? (
                      <Link
                        href={`/discover/artiste/${track.artistPublicId || track.artistId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="truncate text-[13px] text-white/45 hover:underline"
                      >
                        <TrackArtistLine
                          artist={track.artist}
                          className="text-[13px]"
                        />
                      </Link>
                    ) : (
                      <TrackArtistLine
                        artist={track.artist}
                        className="text-[13px] text-white/45"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    className="grid size-8 shrink-0 place-items-center rounded-full text-white/35 opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-white"
                    aria-label="Plus"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (href) router.push(href);
                    }}
                  >
                    <HugeiconsIcon icon={MoreHorizontalIcon} size={18} />
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

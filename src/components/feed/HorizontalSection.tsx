"use client";

import Image from "next/image";
import Link from "next/link";
import type { Album, Artist, Track } from "@/lib/types/music";
import { TrackDuration } from "@/components/discover/TrackDuration";
import { TrackArtistLine } from "@/components/discover/ExplicitBadge";
import { SectionScroller } from "./SectionScroller";
import { PreloadOnVisible } from "./PreloadOnVisible";

type CardSize = "sm" | "md" | "lg";

const CARD: Record<
  CardSize,
  { width: string; sizes: string; coverRound: string }
> = {
  sm: {
    width: "w-[108px] sm:w-[118px]",
    sizes: "118px",
    coverRound: "rounded-xl",
  },
  md: {
    width: "w-[140px] sm:w-[156px]",
    sizes: "156px",
    coverRound: "rounded-2xl",
  },
  lg: {
    width: "w-[160px] sm:w-[180px]",
    sizes: "180px",
    coverRound: "rounded-2xl",
  },
};

const ARTIST: Record<CardSize, { width: string; avatar: string; sizes: string }> =
  {
    sm: {
      width: "w-[100px] sm:w-[110px]",
      avatar: "size-[100px] sm:size-[110px]",
      sizes: "110px",
    },
    md: {
      width: "w-[120px] sm:w-[132px]",
      avatar: "size-[120px] sm:size-[132px]",
      sizes: "132px",
    },
    lg: {
      width: "w-[132px] sm:w-[148px]",
      avatar: "size-[132px] sm:size-[148px]",
      sizes: "148px",
    },
  };

type HorizontalSectionProps =
  | {
      title: string;
      kind: "artists";
      items: Artist[];
      emptyLabel?: string;
      cardSize?: CardSize;
      seeAllHref?: string;
    }
  | {
      title: string;
      kind: "albums";
      items: Album[];
      emptyLabel?: string;
      cardSize?: CardSize;
      seeAllHref?: string;
    }
  | {
      title: string;
      kind: "tracks";
      items: Track[];
      emptyLabel?: string;
      cardSize?: CardSize;
      seeAllHref?: string;
    };

export function HorizontalSection(props: HorizontalSectionProps) {
  const emptyLabel = props.emptyLabel || "Rien à afficher pour le moment.";
  const size = props.cardSize || "sm";
  const card = CARD[size];
  const artistCard = ARTIST[size];
  const empty = props.items.length === 0;

  return (
    <SectionScroller
      title={props.title}
      seeAllHref={props.seeAllHref}
      empty={empty}
      emptyLabel={emptyLabel}
    >
      {props.kind === "artists" &&
        props.items.map((artist) => (
          <Link
            key={artist.id}
            href={`/discover/artiste/${artist.id}`}
            className={`${artistCard.width} shrink-0 text-center transition hover:-translate-y-0.5`}
          >
            <div
              className={`relative mx-auto overflow-hidden rounded-full ring-1 ring-white/10 ${artistCard.avatar}`}
            >
              <Image
                src={artist.avatar}
                alt={artist.name}
                fill
                className="object-cover"
                sizes={artistCard.sizes}
              />
            </div>
            <p className="mt-2.5 truncate text-sm font-semibold text-white">
              {artist.name}
            </p>
            <p className="truncate text-xs text-white/40">{artist.genre}</p>
          </Link>
        ))}

      {props.kind === "albums" &&
        props.items.map((album) => (
          <Link
            key={album.id}
            href={`/discover/release/${album.id}`}
            className={`${card.width} shrink-0 transition hover:-translate-y-0.5`}
          >
            <div
              className={`relative aspect-square overflow-hidden ring-1 ring-white/10 ${card.coverRound}`}
            >
              <Image
                src={album.cover}
                alt={album.title}
                fill
                className="object-cover"
                sizes={card.sizes}
              />
            </div>
            <p className="mt-2.5 truncate text-sm font-semibold text-white">
              {album.title}
            </p>
            <TrackArtistLine
              artist={album.artist}
              explicit={album.explicit}
              className="text-xs text-white/40"
            />
          </Link>
        ))}

      {props.kind === "tracks" &&
        props.items.map((track) => (
          <PreloadOnVisible key={track.id} trackId={track.id} className="shrink-0">
          <Link
            href={
              track.releasePublicId || track.releaseId
                ? `/discover/release/${track.releasePublicId || track.releaseId}`
                : "#"
            }
            className={`${card.width} shrink-0 text-left transition hover:-translate-y-0.5`}
          >
            <div
              className={`relative aspect-square overflow-hidden ring-1 ring-white/10 ${card.coverRound}`}
            >
              <Image
                src={track.cover}
                alt={track.title}
                fill
                className="object-cover"
                sizes={card.sizes}
              />
            </div>
            <p className="mt-2.5 truncate text-sm font-semibold text-white">
              {track.title}
            </p>
            <TrackArtistLine
              artist={track.artist}
              explicit={track.explicit}
              className="text-xs text-white/40"
            />
            <TrackDuration
              seconds={
                track.durationSeconds > 0 ? track.durationSeconds : null
              }
              audioUrl={track.audioUrl}
              className="mt-0.5 block text-xs tabular-nums text-white/35"
            />
          </Link>
          </PreloadOnVisible>
        ))}
    </SectionScroller>
  );
}

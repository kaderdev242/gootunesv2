"use client";

import Link from "next/link";
import type { Album, Artist, Track } from "@/lib/types/music";
import { LazyCover } from "@/components/discover/LazyCover";
import {
  TrackArtistLine,
  TrackTitleLine,
} from "@/components/discover/ExplicitBadge";
import { VerifiedBadge } from "@/components/discover/VerifiedBadge";
import { SectionScroller } from "./SectionScroller";
import { PreloadOnVisible } from "./PreloadOnVisible";

type CardSize = "sm" | "md" | "lg";

const CARD: Record<
  CardSize,
  { width: string; sizes: string; coverRound: string }
> = {
  sm: {
    width: "w-[132px] sm:w-[148px]",
    sizes: "148px",
    coverRound: "rounded-md",
  },
  md: {
    width: "w-[156px] sm:w-[176px]",
    sizes: "176px",
    coverRound: "rounded-md",
  },
  lg: {
    width: "w-[176px] sm:w-[200px]",
    sizes: "200px",
    coverRound: "rounded-md",
  },
};

const ARTIST: Record<CardSize, { width: string; avatar: string; sizes: string }> =
  {
    sm: {
      width: "w-[120px] sm:w-[132px]",
      avatar: "size-[120px] sm:size-[132px]",
      sizes: "132px",
    },
    md: {
      width: "w-[140px] sm:w-[156px]",
      avatar: "size-[140px] sm:size-[156px]",
      sizes: "156px",
    },
    lg: {
      width: "w-[156px] sm:w-[176px]",
      avatar: "size-[156px] sm:size-[176px]",
      sizes: "176px",
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
            className={`${artistCard.width} shrink-0 text-center`}
          >
            <LazyCover
              src={artist.avatar}
              alt={artist.name}
              sizes={artistCard.sizes}
              className={`mx-auto rounded-full ${artistCard.avatar}`}
            />
            <p className="mt-3 flex items-center justify-center gap-1 truncate text-sm font-medium text-white">
              <span className="truncate">{artist.name}</span>
              {artist.verified ? (
                <VerifiedBadge size={13} className="shrink-0" />
              ) : null}
            </p>
            <p className="truncate text-[13px] text-white/45">{artist.genre}</p>
          </Link>
        ))}

      {props.kind === "albums" &&
        props.items.map((album) => (
          <Link
            key={album.id}
            href={`/discover/release/${album.id}`}
            className={`group ${card.width} shrink-0`}
          >
            <div className="overflow-hidden">
              <LazyCover
                src={album.cover}
                alt={album.title}
                sizes={card.sizes}
                className={`aspect-square ${card.coverRound}`}
                imgClassName="transition-[filter] duration-200 group-hover:brightness-110"
              />
            </div>
            <TrackTitleLine
              title={album.title}
              explicit={album.explicit}
              className="mt-2.5 line-clamp-2 text-sm font-medium leading-snug text-white"
            />
            <TrackArtistLine
              artist={album.artist}
              verified={album.artistVerified}
              className="mt-0.5 text-[13px] text-white/45"
            />
          </Link>
        ))}

      {props.kind === "tracks" &&
        props.items.map((track) => (
          <PreloadOnVisible
            key={track.id}
            trackId={track.id}
            className={`${card.width} shrink-0`}
          >
            <Link
              href={
                track.releasePublicId || track.releaseId
                  ? `/discover/release/${track.releasePublicId || track.releaseId}`
                  : "#"
              }
              className="group block w-full text-left"
            >
              <div className="overflow-hidden">
                <LazyCover
                  src={track.cover}
                  alt={track.title}
                  sizes={card.sizes}
                  className={`aspect-square ${card.coverRound}`}
                  imgClassName="transition-[filter] duration-200 group-hover:brightness-110"
                />
              </div>
              <TrackTitleLine
                title={track.title}
                explicit={track.explicit}
                className="mt-2.5 line-clamp-2 text-sm font-medium leading-snug text-white"
              />
              <TrackArtistLine
                artist={track.artist}
                verified={track.artistVerified}
                className="mt-0.5 text-[13px] text-white/45"
              />
            </Link>
          </PreloadOnVisible>
        ))}
    </SectionScroller>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { CoverAtmosphere } from "@/components/discover/CoverAtmosphere";
import { ExplicitBadge } from "@/components/discover/ExplicitBadge";
import { ReleaseDetailActions } from "@/components/discover/ReleaseDetailActions";
import { FALLBACK_COVER } from "@/lib/types/music";

export function ReleaseDetailHero({
  releaseId,
  title,
  type,
  genre,
  cover,
  priceLabel,
  owned,
  trackCount,
  durationLabel,
  year,
  artist,
  explicit,
}: {
  releaseId: string;
  title: string;
  type: string;
  genre?: string | null;
  cover: string;
  priceLabel: string;
  owned: boolean;
  trackCount: number;
  durationLabel?: string | null;
  year?: number | null;
  explicit?: boolean;
  artist?: {
    id: string;
    public_id?: string;
    stage_name: string;
    avatar_url?: string | null;
  } | null;
}) {
  const metaParts = [
    `${trackCount} titre${trackCount > 1 ? "s" : ""}`,
    durationLabel,
    year ? String(year) : null,
    genre,
  ].filter(Boolean);

  return (
    <section className="relative -mx-4 overflow-hidden sm:-mx-6 lg:mx-0 lg:rounded-[28px]">
      <CoverAtmosphere coverUrl={cover} intensity="panel" className="lg:rounded-[28px]" />

      <div className="relative flex flex-col gap-8 px-4 pt-8 pb-10 sm:px-6 sm:pt-10 sm:pb-12 md:flex-row md:items-end md:gap-10 lg:px-8">
        <div className="relative mx-auto aspect-square w-full max-w-[280px] shrink-0 overflow-hidden rounded-lg shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10 md:mx-0 md:w-[280px] lg:max-w-[320px] lg:w-[320px]">
          <Image
            src={cover}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 280px, 320px"
            priority
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-white/45 uppercase">
              {type === "album" ? "Album" : "Single"}
              {owned ? " · Acheté" : ""}
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>

            {artist ? (
              <Link
                href={`/discover/artiste/${artist.public_id || artist.id}`}
                className="mt-4 inline-flex items-center gap-2.5 text-sm font-medium text-white transition hover:text-white/80"
              >
                <span className="relative size-7 overflow-hidden rounded-full ring-1 ring-white/25">
                  <Image
                    src={artist.avatar_url || FALLBACK_COVER}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="28px"
                  />
                </span>
                {explicit ? <ExplicitBadge /> : null}
                {artist.stage_name}
              </Link>
            ) : null}

            <p className="mt-3 text-xs font-medium tracking-wide text-white/45 uppercase">
              {metaParts.join(" · ")}
            </p>
          </div>

          <ReleaseDetailActions
            releaseId={releaseId}
            title={title}
            priceLabel={priceLabel}
            owned={owned}
          />
        </div>
      </div>
    </section>
  );
}

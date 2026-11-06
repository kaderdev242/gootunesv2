"use client";

import type { ReactNode } from "react";
import { AppImage } from "@/components/media/AppImage";
import { CoverAtmosphere } from "@/components/discover/CoverAtmosphere";
import { CollectionPlayControls } from "@/components/discover/CollectionPlayControls";
import type { Track } from "@/lib/types/music";

export function DetailHero({
  kicker,
  title,
  cover,
  identity,
  meta,
  tracks,
  trailing,
  showShuffle = false,
}: {
  kicker: string;
  title: string;
  cover: string;
  identity?: ReactNode;
  meta?: string;
  tracks: Track[];
  trailing?: ReactNode;
  showShuffle?: boolean;
}) {
  return (
    <section className="relative -mx-5 -mt-5 overflow-hidden sm:-mx-8 sm:-mt-6 lg:-mx-10">
      <CoverAtmosphere coverUrl={cover} intensity="page" />

      <div className="relative flex flex-col gap-8 px-5 pt-10 pb-8 sm:px-8 sm:pt-12 md:flex-row md:items-end md:gap-10 lg:px-10 lg:pb-10">
        <div className="relative mx-auto aspect-square w-full max-w-[220px] shrink-0 overflow-hidden rounded-md shadow-[0_28px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/12 sm:max-w-[240px] md:mx-0 md:w-[240px] lg:w-[260px] lg:max-w-[260px]">
          <AppImage
            src={cover}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 240px, 260px"
            priority
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-[12px] font-medium text-white/55">
            {kicker}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
            {title}
          </h1>
          {identity ? <div className="mt-4">{identity}</div> : null}
          {meta ? (
            <p className="mt-3 text-xs font-medium text-white/45">
              {meta}
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <CollectionPlayControls tracks={tracks} showShuffle={showShuffle} />
            {trailing}
          </div>
        </div>
      </div>
    </section>
  );
}

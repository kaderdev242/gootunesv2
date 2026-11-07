"use client";

import type { ReactNode } from "react";
import { AppImage } from "@/components/media/AppImage";
import { CoverAtmosphere } from "@/components/discover/CoverAtmosphere";
import { CollectionPlayControls, ShuffleAction } from "@/components/discover/CollectionPlayControls";
import type { Track } from "@/lib/types/music";

/**
 * En-tête des pages album, single et playlist.
 * Ligne d'actions : « Lire » et l'achat à gauche, actions en icônes à droite.
 */
export function DetailHero({
  kicker,
  title,
  cover,
  identity,
  meta,
  tracks,
  primary,
  actions,
  trailing,
  showShuffle = false,
}: {
  kicker: string;
  title: string;
  cover: string;
  identity?: ReactNode;
  meta?: string;
  tracks: Track[];
  /** À côté de « Lire » (ex. bouton Acheter). */
  primary?: ReactNode;
  /** Actions en icônes, à droite (Crédits, Partager…). */
  actions?: ReactNode;
  /** Ancien emplacement : affiché avec les actions. */
  trailing?: ReactNode;
  showShuffle?: boolean;
}) {
  return (
    <section className="relative -mx-5 -mt-5 overflow-hidden sm:-mx-8 sm:-mt-6 lg:-mx-10">
      <CoverAtmosphere coverUrl={cover} intensity="page" />

      <div className="relative px-5 pt-10 pb-8 sm:px-8 sm:pt-12 lg:px-10 lg:pb-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:gap-10">
          <div className="relative mx-auto aspect-square w-full max-w-[220px] shrink-0 overflow-hidden rounded-md shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:max-w-[240px] md:mx-0 md:w-[240px] lg:w-[260px] lg:max-w-[260px]">
            <AppImage src={cover} alt={title} fill className="object-cover" sizes="(max-width: 768px) 240px, 260px" priority />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-[12px] font-medium text-white/55">{kicker}</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
              {title}
            </h1>
            {identity ? <div className="mt-4">{identity}</div> : null}
            {meta ? <p className="mt-3 text-[13px] text-white/55">{meta}</p> : null}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <CollectionPlayControls tracks={tracks} />
            {primary}
          </div>
          <div className="flex items-start gap-1 sm:gap-2">
            {showShuffle ? <ShuffleAction tracks={tracks} /> : null}
            {actions}
            {trailing}
          </div>
        </div>
      </div>
    </section>
  );
}

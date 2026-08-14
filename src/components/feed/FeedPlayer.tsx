"use client";

import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowExpand01Icon,
  Cancel01Icon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  ShoppingBag01Icon,
  VolumeHighIcon,
  VolumeMute01Icon,
} from "@hugeicons/core-free-icons";
import { FALLBACK_COVER } from "@/lib/types/music";
import { IconButton } from "@/components/ui/IconButton";
import { usePlayer } from "./PlayerProvider";
import { FullscreenPlayer } from "./FullscreenPlayer";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function FeedPlayer() {
  const {
    current,
    hasTrack,
    isPlaying,
    currentTime,
    effectiveDuration,
    accessMode,
    owned,
    previewEnded,
    previewSeconds,
    volume,
    muted,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    next,
    previous,
    openFullscreen,
    closePlayer,
    closeFullscreen,
  } = usePlayer();

  if (!hasTrack || !current) return <FullscreenPlayer />;

  const pct =
    effectiveDuration > 0
      ? Math.min(100, (currentTime / effectiveDuration) * 100)
      : 0;

  const buyHref = current.releasePublicId || current.releaseId
    ? `/discover/release/${current.releasePublicId || current.releaseId}/acheter`
    : null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-[#0e0e0e]/95 backdrop-blur-xl">
        {accessMode === "preview" ? (
          <div className="flex items-center justify-center gap-2 border-b border-white/5 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/55">
            <span>
              Aperçu {previewSeconds}s
              {previewEnded ? " terminé — achète pour écouter en entier" : ""}
            </span>
            {buyHref && !owned ? (
              <Link
                href={buyHref}
                onClick={closeFullscreen}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 font-semibold text-black"
              >
                <HugeiconsIcon icon={ShoppingBag01Icon} size={12} />
                Acheter
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="border-b border-white/5 bg-emerald-500/10 px-3 py-1 text-center text-[11px] font-medium text-emerald-200">
            Titre acheté — écoute illimitée
          </div>
        )}

        {/* Mobile: couverture + infos | contrôles | fermer — Desktop: 3 colonnes */}
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-2 py-2 sm:grid sm:h-[84px] sm:grid-cols-[minmax(0,1fr)_minmax(240px,420px)_minmax(0,1fr)] sm:gap-4 sm:px-5 sm:py-0">
          <button
            type="button"
            onClick={openFullscreen}
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left sm:flex-none"
          >
            <div className="relative size-11 shrink-0 overflow-hidden rounded-xl sm:size-12">
              <Image
                src={current.cover || FALLBACK_COVER}
                alt={current.title}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {current.title}
              </p>
              <p className="truncate text-xs text-white/45">{current.artist}</p>
            </div>
          </button>

          <div className="flex shrink-0 flex-col items-center gap-1.5 sm:w-full sm:gap-2">
            <div className="flex items-center gap-0.5 sm:gap-3">
              <IconButton
                className="hidden size-9 sm:inline-flex"
                onClick={previous}
                aria-label="Précédent"
              >
                <HugeiconsIcon icon={PreviousIcon} size={18} />
              </IconButton>
              <button
                type="button"
                onClick={togglePlay}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-black sm:size-11"
                aria-label={isPlaying ? "Pause" : "Lecture"}
              >
                <HugeiconsIcon
                  icon={isPlaying ? PauseIcon : PlayIcon}
                  size={18}
                />
              </button>
              <IconButton
                className="hidden size-9 sm:inline-flex"
                onClick={next}
                aria-label="Suivant"
              >
                <HugeiconsIcon icon={NextIcon} size={18} />
              </IconButton>
            </div>
            <div className="hidden w-full items-center gap-3 text-[11px] text-white/40 sm:flex">
              <span className="w-10 tabular-nums">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={effectiveDuration || 1}
                step={0.1}
                value={Math.min(currentTime, effectiveDuration || 0)}
                onChange={(e) => seek(Number(e.target.value))}
                className="player-range h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/10"
                style={{
                  background: `linear-gradient(to right, white ${pct}%, rgb(255 255 255 / 10%) ${pct}%)`,
                }}
                aria-label="Progression"
              />
              <span className="w-10 text-right tabular-nums">
                {formatTime(effectiveDuration)}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-0.5 sm:gap-2">
            <IconButton
              className="hidden size-9 lg:inline-flex"
              onClick={toggleMute}
              aria-label={muted ? "Activer le son" : "Couper le son"}
            >
              <HugeiconsIcon
                icon={muted || volume === 0 ? VolumeMute01Icon : VolumeHighIcon}
                size={18}
              />
            </IconButton>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="player-range hidden h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/10 lg:block xl:w-20"
              aria-label="Volume"
            />
            <IconButton
              className="hidden size-9 sm:inline-flex"
              onClick={openFullscreen}
              aria-label="Plein écran"
            >
              <HugeiconsIcon icon={ArrowExpand01Icon} size={18} />
            </IconButton>
            <IconButton
              className="size-9"
              onClick={closePlayer}
              aria-label="Fermer le lecteur"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
            </IconButton>
          </div>
        </div>

        {/* Barre de progression mobile */}
        <div className="px-3 pb-2 sm:hidden">
          <input
            type="range"
            min={0}
            max={effectiveDuration || 1}
            step={0.1}
            value={Math.min(currentTime, effectiveDuration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            className="player-range h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10"
            style={{
              background: `linear-gradient(to right, white ${pct}%, rgb(255 255 255 / 10%) ${pct}%)`,
            }}
            aria-label="Progression"
          />
        </div>
      </div>

      <FullscreenPlayer />
    </>
  );
}

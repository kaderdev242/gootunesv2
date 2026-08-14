"use client";

import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  ShoppingBag01Icon,
  VolumeHighIcon,
  VolumeMute01Icon,
} from "@hugeicons/core-free-icons";
import { CoverAtmosphere } from "@/components/discover/CoverAtmosphere";
import { IconButton } from "@/components/ui/IconButton";
import { FALLBACK_COVER } from "@/lib/types/music";
import { usePlayer } from "./PlayerProvider";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function FullscreenPlayer() {
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
    isFullscreen,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    next,
    previous,
    closeFullscreen,
  } = usePlayer();

  if (!isFullscreen || !hasTrack || !current) return null;

  const pct =
    effectiveDuration > 0
      ? Math.min(100, (currentTime / effectiveDuration) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#070707] text-white">
      <CoverAtmosphere coverUrl={current.cover} intensity="fullscreen" />

      <div className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-8">
        <p className="text-sm text-white/50">Lecture en cours</p>
        <IconButton
          onClick={closeFullscreen}
          aria-label="Fermer le lecteur"
          className="text-white/80"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={22} />
        </IconButton>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 pb-10">
        <div className="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-[28px] shadow-2xl shadow-black/60 ring-1 ring-white/15">
          <Image
            src={current.cover || FALLBACK_COVER}
            alt={current.title}
            fill
            className="object-cover"
            sizes="320px"
            priority
          />
        </div>

        <div className="mt-8 w-full text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {current.title}
          </h2>
          <p className="mt-1 text-sm text-white/55">{current.artist}</p>
          {accessMode === "preview" ? (
            <p className="mt-3 text-xs text-white/40">
              Aperçu {previewSeconds}s
              {previewEnded ? " · terminé" : ""}
            </p>
          ) : (
            <p className="mt-3 text-xs font-medium text-emerald-300">
              Acheté · écoute complète
            </p>
          )}
        </div>

        <div className="mt-8 w-full">
          <input
            type="range"
            min={0}
            max={effectiveDuration || 1}
            step={0.1}
            value={Math.min(currentTime, effectiveDuration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            className="player-range h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10"
            style={{
              background: `linear-gradient(to right, white ${pct}%, rgb(255 255 255 / 10%) ${pct}%)`,
            }}
            aria-label="Progression"
          />
          <div className="mt-2 flex justify-between text-xs text-white/40">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(effectiveDuration)}</span>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-5">
          <IconButton onClick={previous} aria-label="Précédent">
            <HugeiconsIcon icon={PreviousIcon} size={22} />
          </IconButton>
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex size-16 items-center justify-center rounded-full bg-white text-black"
            aria-label={isPlaying ? "Pause" : "Lecture"}
          >
            <HugeiconsIcon icon={isPlaying ? PauseIcon : PlayIcon} size={26} />
          </button>
          <IconButton onClick={next} aria-label="Suivant">
            <HugeiconsIcon icon={NextIcon} size={22} />
          </IconButton>
        </div>

        <div className="mt-6 flex w-full items-center gap-3">
          <IconButton onClick={toggleMute} aria-label="Volume">
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
            className="player-range h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10"
            aria-label="Volume"
          />
        </div>

        {accessMode === "preview" &&
        (current.releasePublicId || current.releaseId) &&
        !owned ? (
          <Link
            href={`/discover/release/${current.releasePublicId || current.releaseId}/acheter`}
            onClick={closeFullscreen}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black"
          >
            <HugeiconsIcon icon={ShoppingBag01Icon} size={16} />
            Acheter pour écouter en entier
          </Link>
        ) : null}
      </div>
    </div>
  );
}

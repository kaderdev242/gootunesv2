"use client";

import { AppImage } from "@/components/media/AppImage";
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
import {
  TrackArtistLine,
  TrackTitleLine,
} from "@/components/discover/ExplicitBadge";
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

      <div className="relative z-10 flex shrink-0 items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 sm:px-8 sm:pt-6">
        <p className="text-sm text-white/50">Lecture en cours</p>
        <IconButton
          onClick={closeFullscreen}
          aria-label="Fermer le lecteur"
          className="text-white/80"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={22} />
        </IconButton>
      </div>

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col items-center justify-center overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="relative aspect-square w-full max-w-[min(100%,280px)] shrink-0 overflow-hidden rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/15 sm:max-w-[320px] sm:rounded-[28px] max-[480px]:max-h-[38vh] max-[480px]:w-auto max-[480px]:max-w-[38vh]">
          <AppImage
            src={current.cover || FALLBACK_COVER}
            alt={current.title}
            fill
            className="object-cover"
            sizes="(max-width: 480px) 38vh, 320px"
            priority
          />
        </div>

        <div className="mt-5 w-full shrink-0 text-center sm:mt-8">
          <div className="flex justify-center px-2">
            <TrackTitleLine
              title={current.title}
              explicit={current.explicit}
              className="font-display line-clamp-2 text-xl font-bold tracking-tight sm:text-3xl"
            />
          </div>
          <div className="mt-1 flex justify-center">
            <TrackArtistLine
              artist={current.artist}
              className="text-sm text-white/55"
            />
          </div>
        </div>

        <div className="mt-5 w-full shrink-0 sm:mt-8">
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

        <div className="mt-5 flex shrink-0 items-center gap-4 sm:mt-6 sm:gap-5">
          <IconButton onClick={previous} aria-label="Précédent">
            <HugeiconsIcon icon={PreviousIcon} size={22} />
          </IconButton>
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex size-14 items-center justify-center rounded-full bg-white text-black sm:size-16"
            aria-label={isPlaying ? "Pause" : "Lecture"}
          >
            <HugeiconsIcon icon={isPlaying ? PauseIcon : PlayIcon} size={26} />
          </button>
          <IconButton onClick={next} aria-label="Suivant">
            <HugeiconsIcon icon={NextIcon} size={22} />
          </IconButton>
        </div>

        <div className="mt-4 hidden w-full shrink-0 items-center gap-3 sm:mt-6 sm:flex">
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
            className="mt-5 inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black sm:mt-8 sm:h-12 sm:px-6"
          >
            <HugeiconsIcon icon={ShoppingBag01Icon} size={16} />
            Acheter pour écouter en entier
          </Link>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { AppImage } from "@/components/media/AppImage";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  PauseIcon,
  PlayIcon,
  VolumeHighIcon,
  VolumeMute01Icon,
} from "@hugeicons/core-free-icons";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function DashboardPlayer({
  title,
  artist,
  coverUrl,
  isPlaying,
  currentTime,
  duration,
  volume,
  onToggle,
  onSeek,
  onVolumeChange,
  onClose,
}: {
  title: string;
  artist?: string | null;
  coverUrl?: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onToggle: () => void;
  onSeek: (ratio: number) => void;
  onVolumeChange: (volume: number) => void;
  onClose: () => void;
}) {
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const muted = volume <= 0.001;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-white/12 bg-[#0c0c0c]/92 shadow-[0_-20px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <div className="violet-card absolute inset-0 opacity-40" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 z-10 flex size-8 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white"
          aria-label="Fermer le lecteur"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} />
        </button>

        <div className="relative flex items-center gap-3 p-3 pr-12 sm:gap-4 sm:p-4 sm:pr-14">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 ring-1 ring-white/10 sm:size-16">
            {coverUrl ? (
              <AppImage
                src={coverUrl}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold text-white sm:text-base">
              {title}
            </p>
            {artist ? (
              <p className="truncate text-xs text-white/45">{artist}</p>
            ) : null}

            <div className="mt-2.5 flex items-center gap-3">
              <button
                type="button"
                onClick={onToggle}
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition-[background-color,transform] duration-150 hover:bg-white/90 active:scale-[0.97]"
                aria-label={isPlaying ? "Pause" : "Lecture"}
              >
                <HugeiconsIcon
                  icon={isPlaying ? PauseIcon : PlayIcon}
                  size={18}
                />
              </button>

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  className="group relative h-1.5 w-full overflow-hidden rounded-full bg-white/10"
                  aria-label="Progression"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = (e.clientX - rect.left) / rect.width;
                    onSeek(Math.min(1, Math.max(0, ratio)));
                  }}
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width]"
                    style={{ width: `${progress * 100}%` }}
                  />
                  <span
                    className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition group-hover:opacity-100"
                    style={{ left: `calc(${progress * 100}% - 6px)` }}
                  />
                </button>
                <div className="mt-1 flex justify-between text-[10px] tabular-nums text-white/35">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
                  aria-label={muted ? "Activer le son" : "Couper le son"}
                  onClick={() => onVolumeChange(muted ? 0.8 : 0)}
                >
                  <HugeiconsIcon
                    icon={muted ? VolumeMute01Icon : VolumeHighIcon}
                    size={16}
                  />
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  aria-label="Volume"
                  className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/15 accent-white [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>
            </div>

            {/* Volume compact mobile */}
            <div className="mt-2 flex items-center gap-2 sm:hidden">
              <button
                type="button"
                className="flex size-7 items-center justify-center text-white/60"
                aria-label={muted ? "Activer le son" : "Couper le son"}
                onClick={() => onVolumeChange(muted ? 0.8 : 0)}
              >
                <HugeiconsIcon
                  icon={muted ? VolumeMute01Icon : VolumeHighIcon}
                  size={14}
                />
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                aria-label="Volume"
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-white [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

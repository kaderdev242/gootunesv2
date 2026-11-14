"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Album02Icon,
  ArrowExpand01Icon,
  Cancel01Icon,
  FavouriteIcon,
  LeftToRightListBulletIcon,
  MoreHorizontalIcon,
  MusicNote01Icon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  RepeatIcon,
  RepeatOne01Icon,
  Share08Icon,
  ShoppingBag01Icon,
  ShuffleIcon,
  UserIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMute01Icon,
} from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { FALLBACK_COVER } from "@/lib/types/music";
import { formatFcfa } from "@/lib/format";
import { PREVIEW_SECONDS } from "@/lib/audio/constants";
import { TrackTitleLine } from "@/components/discover/ExplicitBadge";
import { NowPlayingBars } from "@/components/discover/NowPlayingBars";
import { usePlayer } from "./PlayerProvider";

const FullscreenPlayer = dynamic(
  () => import("./FullscreenPlayer").then((m) => ({ default: m.FullscreenPlayer })),
  { ssr: false },
);

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Bouton icône du player : 36 px, couleur au survol, état actif en violet. */
function Ctl({
  label,
  onClick,
  active = false,
  children,
  className = "",
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      className={`relative inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-[color,background-color,transform] duration-150 active:scale-[0.94] ${
        active ? "text-violet-300" : "text-white/70 hover:text-white"
      } ${className}`}
    >
      {children}
      {active ? <span className="absolute bottom-0.5 size-1 rounded-full bg-violet-300" /> : null}
    </button>
  );
}

function ProgressBar({
  value,
  max,
  onSeek,
  className = "",
}: {
  value: number;
  max: number;
  onSeek: (v: number) => void;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <input
      type="range"
      min={0}
      max={max || 1}
      step={0.1}
      value={Math.min(value, max || 0)}
      onChange={(e) => onSeek(Number(e.target.value))}
      className={`player-range h-1 cursor-pointer appearance-none rounded-full ${className}`}
      style={{ background: `linear-gradient(to right, rgb(255 255 255 / 90%) ${pct}%, rgb(255 255 255 / 15%) ${pct}%)` }}
      aria-label="Progression"
    />
  );
}

/** Menu « … » : aller à la sortie, à l'artiste, partager. */
function MoreMenu() {
  const { current } = usePlayer();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!current) return null;
  const releaseHref = current.releasePublicId || current.releaseId ? `/discover/release/${current.releasePublicId || current.releaseId}` : null;
  const artistHref = current.artistPublicId || current.artistId ? `/discover/artiste/${current.artistPublicId || current.artistId}` : null;

  const share = async () => {
    setOpen(false);
    const url = releaseHref ? `${window.location.origin}${releaseHref}` : window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: current.title, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* partage annulé */
    }
  };

  const item = "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[14px] text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white";

  return (
    <div ref={ref} className="relative">
      <Ctl label="Plus d'options" onClick={() => setOpen((v) => !v)}>
        <HugeiconsIcon icon={MoreHorizontalIcon} size={18} strokeWidth={1.75} />
      </Ctl>
      {open ? (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-xl border border-white/[0.08] bg-[#1a1a1a]/95 p-1 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {releaseHref ? (
            <Link href={releaseHref} onClick={() => setOpen(false)} className={item}>
              <HugeiconsIcon icon={Album02Icon} size={18} strokeWidth={1.5} className="text-white/50" />
              Voir la sortie
            </Link>
          ) : null}
          {artistHref ? (
            <Link href={artistHref} onClick={() => setOpen(false)} className={item}>
              <HugeiconsIcon icon={UserIcon} size={18} strokeWidth={1.5} className="text-white/50" />
              Voir l&apos;artiste
            </Link>
          ) : null}
          <button type="button" onClick={share} className={item}>
            <HugeiconsIcon icon={Share08Icon} size={18} strokeWidth={1.5} className="text-white/50" />
            Partager
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Mobile : widget flottant à droite (pochette + onde + lecture/pause)
 * à la place de la barre pleine largeur. Un tap ouvre le grand lecteur.
 */
function MobilePlayerWidget() {
  const { current, isPlaying, currentTime, effectiveDuration, togglePlay, openFullscreen, closePlayer } = usePlayer();
  if (!current) return null;

  const pct = effectiveDuration > 0 ? Math.min(1, currentTime / effectiveDuration) : 0;
  const R = 21;
  const C = 2 * Math.PI * R;
  const BARS = [0.55, 0.9, 0.65, 1, 0.5];

  return (
    <div className="fixed right-3 bottom-[calc(56px+env(safe-area-inset-bottom)+12px)] z-40 sm:hidden">
      <div className="relative flex items-center gap-1 rounded-full border border-white/[0.1] bg-[#141414]/80 p-1 pr-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-150">
        <button
          type="button"
          onClick={() => openFullscreen()}
          aria-label={`Ouvrir le lecteur : ${current.title}, ${current.artist}`}
          className="flex items-center gap-2 rounded-full pr-0.5 active:scale-[0.97] transition-transform duration-150"
        >
          <span className="relative block size-[46px] shrink-0">
            <svg viewBox="0 0 46 46" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="23" cy="23" r={R} fill="none" stroke="rgb(255 255 255 / 0.14)" strokeWidth="2" />
              <circle
                cx="23"
                cy="23"
                r={R}
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - pct)}
              />
            </svg>
            <span className="absolute inset-[4px] overflow-hidden rounded-full">
              <AppImage src={current.cover || FALLBACK_COVER} alt="" fill className="object-cover" sizes="38px" />
            </span>
          </span>
          <span className={`flex h-5 items-center gap-[2.5px] ${isPlaying ? "" : "now-playing-paused"}`} aria-hidden>
            {BARS.map((h, i) => (
              <span
                key={i}
                className="now-playing-bar w-[2.5px] rounded-full bg-white"
                style={{ height: `${h * 100}%`, transformOrigin: "center", animationDelay: `${-i * 190}ms` }}
              />
            ))}
          </span>
        </button>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Lecture"}
          className="ml-1 inline-flex size-9 items-center justify-center rounded-full bg-white text-black transition-transform duration-150 active:scale-[0.94]"
        >
          <HugeiconsIcon icon={isPlaying ? PauseIcon : PlayIcon} size={16} strokeWidth={2} />
        </button>
        {!isPlaying ? (
          <button
            type="button"
            onClick={closePlayer}
            aria-label="Fermer le lecteur"
            className="absolute -left-1 -top-1 inline-flex size-5 items-center justify-center rounded-full border border-white/[0.12] bg-[#1f1f1f] text-white/80"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={11} strokeWidth={2} />
          </button>
        ) : null}
      </div>
    </div>
  );
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
    volume,
    muted,
    shuffle,
    repeat,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    next,
    previous,
    toggleShuffle,
    cycleRepeat,
    toggleLike,
    isLiked,
    openFullscreen,
    closePlayer,
  } = usePlayer();

  if (!hasTrack || !current) return <FullscreenPlayer />;

  const liked = isLiked(current.id);
  const preview = accessMode === "preview" && !owned;
  const releaseId = current.releasePublicId || current.releaseId;
  const buyHref = releaseId ? `/discover/release/${releaseId}/acheter` : null;
  const artistHref = current.artistPublicId || current.artistId ? `/discover/artiste/${current.artistPublicId || current.artistId}` : null;
  const volumeIcon = muted || volume === 0 ? VolumeMute01Icon : volume < 0.5 ? VolumeLowIcon : VolumeHighIcon;

  return (
    <>
      <MobilePlayerWidget />
      <div className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-40 hidden border-t border-white/[0.08] bg-[#141414]/70 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-150 sm:block lg:bottom-0 lg:pb-[env(safe-area-inset-bottom)]">
        {/* Progression fine en haut (mobile) */}
        <ProgressBar value={currentTime} max={effectiveDuration} onSeek={seek} className="absolute inset-x-0 top-0 block w-full rounded-none sm:hidden" />

        <div className="mx-auto grid max-w-[1800px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 sm:h-[88px] sm:grid-cols-[minmax(0,1fr)_minmax(320px,560px)_minmax(0,1fr)] sm:gap-6 sm:px-5 sm:py-0">
          {/* ── Titre en cours ── */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => openFullscreen()}
              aria-label="Ouvrir le lecteur"
              className="group relative size-12 shrink-0 overflow-hidden rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.4)] sm:size-14"
            >
              <AppImage src={current.cover || FALLBACK_COVER} alt={current.title} fill className="object-cover" sizes="56px" />
              <span className="absolute inset-0 hidden items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                <HugeiconsIcon icon={ArrowExpand01Icon} size={18} strokeWidth={1.75} />
              </span>
            </button>
            <div className="min-w-0">
              <button type="button" onClick={() => openFullscreen()} className="flex min-w-0 max-w-full items-center gap-2 text-left">
                <NowPlayingBars paused={!isPlaying} className="shrink-0" />
                <TrackTitleLine title={current.title} explicit={current.explicit} className="truncate text-[14px] font-semibold text-white" />
              </button>
              {artistHref ? (
                <Link href={artistHref} className="block truncate text-[13px] text-white/55 transition-colors hover:text-white hover:underline">
                  {current.artist}
                </Link>
              ) : (
                <p className="truncate text-[13px] text-white/55">{current.artist}</p>
              )}
              {current.album ? (
                <p className="hidden items-center gap-1 truncate text-[12px] text-white/40 sm:flex">
                  <HugeiconsIcon icon={MusicNote01Icon} size={12} strokeWidth={1.5} />
                  <span className="truncate">{current.album}</span>
                </p>
              ) : null}
            </div>
            <div className="hidden shrink-0 items-center sm:flex">
              <Ctl label={liked ? "Retirer des favoris" : "Ajouter aux favoris"} onClick={() => toggleLike(current.id)}>
                <HugeiconsIcon
                  icon={FavouriteIcon}
                  size={18}
                  strokeWidth={1.75}
                  className={liked ? "fill-violet-300 text-violet-300" : ""}
                />
              </Ctl>
              <MoreMenu />
            </div>
          </div>

          {/* ── Commandes ── */}
          <div className="flex items-center gap-1 sm:flex-col sm:gap-1.5">
            <div className="flex items-center gap-1 sm:gap-3">
              <Ctl label={shuffle ? "Lecture aléatoire activée" : "Lecture aléatoire"} onClick={toggleShuffle} active={shuffle} className="hidden sm:inline-flex">
                <HugeiconsIcon icon={ShuffleIcon} size={18} strokeWidth={1.75} />
              </Ctl>
              <Ctl label="Précédent" onClick={previous} className="hidden sm:inline-flex">
                <HugeiconsIcon icon={PreviousIcon} size={20} strokeWidth={2} />
              </Ctl>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Lecture"}
                className="inline-flex size-10 items-center justify-center rounded-full bg-white text-black transition-transform duration-150 active:scale-[0.94]"
              >
                <HugeiconsIcon icon={isPlaying ? PauseIcon : PlayIcon} size={20} strokeWidth={2} />
              </button>
              <Ctl label="Suivant" onClick={next} className="hidden sm:inline-flex">
                <HugeiconsIcon icon={NextIcon} size={20} strokeWidth={2} />
              </Ctl>
              <Ctl
                label={repeat === "one" ? "Répéter le titre" : repeat === "all" ? "Répéter la liste" : "Répéter"}
                onClick={cycleRepeat}
                active={repeat !== "off"}
                className="hidden sm:inline-flex"
              >
                <HugeiconsIcon icon={repeat === "one" ? RepeatOne01Icon : RepeatIcon} size={18} strokeWidth={1.75} />
              </Ctl>
              <Ctl label="Fermer le lecteur" onClick={closePlayer} className="sm:hidden">
                <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.75} />
              </Ctl>
            </div>
            <div className="hidden w-full items-center gap-3 sm:flex">
              <span className="w-10 text-right font-mono text-[11px] text-white/45">{formatTime(currentTime)}</span>
              <ProgressBar value={currentTime} max={effectiveDuration} onSeek={seek} className="min-w-0 flex-1" />
              <span className="w-10 font-mono text-[11px] text-white/45">{formatTime(effectiveDuration)}</span>
            </div>
          </div>

          {/* ── Outils ── */}
          <div className="hidden items-center justify-end gap-2 sm:flex">
            <Ctl label="File d'attente" onClick={() => openFullscreen("queue")}>
              <HugeiconsIcon icon={LeftToRightListBulletIcon} size={18} strokeWidth={1.75} />
            </Ctl>
            <div className="group hidden items-center lg:flex">
              <Ctl label={muted ? "Activer le son" : "Couper le son"} onClick={toggleMute}>
                <HugeiconsIcon icon={volumeIcon} size={18} strokeWidth={1.75} />
              </Ctl>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="player-range h-1 w-20 cursor-pointer appearance-none rounded-full"
                style={{
                  background: `linear-gradient(to right, rgb(255 255 255 / 90%) ${(muted ? 0 : volume) * 100}%, rgb(255 255 255 / 15%) ${(muted ? 0 : volume) * 100}%)`,
                }}
                aria-label="Volume"
              />
            </div>
            {preview && buyHref ? (
              <Link
                href={buyHref}
                title={`Extrait de ${PREVIEW_SECONDS} s · achète pour écouter en entier`}
                className="ml-2 inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/[0.1] bg-white/[0.08] px-4 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.14]"
              >
                <HugeiconsIcon icon={ShoppingBag01Icon} size={16} strokeWidth={1.75} />
                Acheter{current.price ? ` · ${formatFcfa(current.price)}` : ""}
              </Link>
            ) : (
              <Ctl label="Agrandir le lecteur" onClick={() => openFullscreen()}>
                <HugeiconsIcon icon={ArrowExpand01Icon} size={18} strokeWidth={1.75} />
              </Ctl>
            )}
            <Ctl label="Fermer le lecteur" onClick={closePlayer}>
              <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.75} />
            </Ctl>
          </div>
        </div>
      </div>

      <FullscreenPlayer />
    </>
  );
}

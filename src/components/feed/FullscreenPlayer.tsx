"use client";

import { useEffect } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  FavouriteIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  RepeatIcon,
  RepeatOne01Icon,
  ShoppingBag01Icon,
  ShuffleIcon,
} from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { FALLBACK_COVER } from "@/lib/types/music";
import { formatFcfa, formatDuration } from "@/lib/format";
import { PREVIEW_SECONDS } from "@/lib/audio/constants";
import { useCoverPalette } from "@/hooks/useCoverPalette";
import { TrackTitleLine } from "@/components/discover/ExplicitBadge";
import { NowPlayingBars } from "@/components/discover/NowPlayingBars";
import { usePlayer, type FullscreenTab } from "./PlayerProvider";

/** Couleur la plus « vivante » de la pochette (saturation × luminosité utile). */
function vividColor(colors: string[]): string | null {
  let best: { c: string; score: number } | null = null;
  for (const c of colors) {
    const m = c.match(/\d+/g);
    if (!m || m.length < 3) continue;
    const [r, g, b] = m.slice(0, 3).map(Number);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const light = max / 255;
    const score = sat * (0.35 + Math.min(light, 0.85));
    if (!best || score > best.score) best = { c, score };
  }
  return best && best.score > 0.08 ? best.c : null;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const TABS: { id: Exclude<FullscreenTab, "cover">; label: string }[] = [
  { id: "queue", label: "File d'attente" },
  { id: "credits", label: "Crédits" },
];

/** Liste « À suivre » : la file en cours, le titre joué mis en avant. */
function QueuePanel() {
  const { queue, current, isPlaying, playTrack } = usePlayer();
  if (!current) return null;
  const list = queue.length ? queue : [current];
  return (
    <div>
      <h2 className="mb-4 text-[20px] font-semibold text-white">À suivre</h2>
      <ul className="space-y-1">
        {list.map((t, i) => {
          const active = t.id === current.id;
          return (
            <li key={`${t.id}-${i}`}>
              <button
                type="button"
                onClick={() => (active ? undefined : void playTrack(t, list))}
                className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                  active ? "bg-white/[0.08]" : "hover:bg-white/[0.05]"
                }`}
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-md">
                  <AppImage src={t.cover || FALLBACK_COVER} alt="" fill className="object-cover" sizes="48px" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    {active ? <NowPlayingBars paused={!isPlaying} className="shrink-0" /> : null}
                    <span className={`truncate text-[15px] font-medium ${active ? "text-violet-200" : "text-white"}`}>{t.title}</span>
                  </span>
                  <span className="block truncate text-[13px] text-white/55">{t.artist}</span>
                </span>
                <span className="shrink-0 font-mono text-[12px] text-white/45">
                  {t.durationSeconds ? formatDuration(t.durationSeconds) : t.duration}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Crédits du titre en cours, à partir des infos connues du catalogue. */
function CreditsPanel() {
  const { current, accessMode, owned } = usePlayer();
  if (!current) return null;
  const rows: [string, string | null | undefined][] = [
    ["Artiste", current.artist],
    ["Sortie", current.album],
    ["Genre", current.genre],
    ["Durée", current.durationSeconds ? formatDuration(current.durationSeconds) : current.duration],
    ["Prix", current.price ? formatFcfa(current.price) : null],
    ["Écoute", owned || accessMode === "full" ? "Titre acheté, écoute complète" : `Extrait de ${PREVIEW_SECONDS} s`],
  ];
  return (
    <dl className="space-y-6">
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k}>
            <dt className="text-[15px] font-semibold text-white">{k}</dt>
            <dd className="mt-1 text-[15px] text-white/60">{v}</dd>
          </div>
        ))}
    </dl>
  );
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
    isFullscreen,
    fullscreenTab,
    setFullscreenTab,
    shuffle,
    repeat,
    togglePlay,
    seek,
    next,
    previous,
    toggleShuffle,
    cycleRepeat,
    toggleLike,
    isLiked,
    closeFullscreen,
  } = usePlayer();

  const palette = useCoverPalette(current?.cover || FALLBACK_COVER);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen, closeFullscreen]);

  if (!isFullscreen || !hasTrack || !current) return null;

  const tabOpen = fullscreenTab !== "cover";
  const preview = accessMode === "preview" && !owned;
  const releaseId = current.releasePublicId || current.releaseId;
  const pct = effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0;
  // Fond : couleur dominante de la pochette, assombrie pour garder le texte lisible.
  const tint = palette ? vividColor([palette.dominant, palette.accent, palette.secondary]) ?? palette.dominant : null;
  const bg = tint ? `color-mix(in srgb, ${tint} 48%, #070707)` : "#121212";

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col text-white transition-[background-color] duration-700 lg:z-30"
      style={{ backgroundColor: bg }}
      role="dialog"
      aria-modal="true"
      aria-label="Lecteur"
    >
      {/* Haut : onglets et fermeture */}
      <div className="flex shrink-0 items-center justify-end gap-1 px-4 pt-[max(12px,env(safe-area-inset-top))] sm:gap-2 sm:px-8 sm:pt-6">
        {TABS.map((t) => {
          const active = fullscreenTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setFullscreenTab(active ? "cover" : t.id)}
              aria-pressed={active}
              className={`h-9 rounded-full px-4 text-[14px] font-medium transition-colors ${
                active ? "bg-white text-black" : "text-white/70 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={closeFullscreen}
          aria-label="Réduire le lecteur"
          title="Réduire le lecteur"
          className="ml-1 flex size-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size={20} strokeWidth={1.75} />
        </button>
      </div>

      {/* Centre : pochette seule, ou pochette + panneau */}
      <div
        className={`mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 gap-10 px-5 pb-6 sm:px-10 lg:pb-[120px] ${
          tabOpen ? "flex-col lg:flex-row lg:items-center" : "flex-col items-center justify-center"
        }`}
      >
        <div className={`flex shrink-0 justify-center ${tabOpen ? "hidden lg:flex lg:w-[44%]" : "w-full"}`}>
          <div
            className={`relative aspect-square overflow-hidden rounded-md shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${
              tabOpen ? "w-full max-w-[560px]" : "w-[min(78vw,58vh)] max-w-[620px]"
            }`}
          >
            <AppImage src={current.cover || FALLBACK_COVER} alt={current.title} fill className="object-cover" sizes="(max-width: 1024px) 80vw, 620px" priority />
          </div>
        </div>

        {tabOpen ? (
          <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin] lg:max-h-[70vh]">
            {fullscreenTab === "queue" ? <QueuePanel /> : <CreditsPanel />}
          </div>
        ) : null}

        {/* Mobile et tablette : titre et commandes (sur ordinateur, le mini player reste en bas) */}
        <div className={`w-full max-w-lg self-center lg:hidden ${tabOpen ? "hidden" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <TrackTitleLine title={current.title} explicit={current.explicit} className="truncate text-[22px] font-semibold text-white" />
              <p className="truncate text-[15px] text-white/60">{current.artist}</p>
              {preview ? <p className="mt-1 font-mono text-[12px] text-white/45">Extrait de {PREVIEW_SECONDS} s</p> : null}
            </div>
            <button
              type="button"
              onClick={() => toggleLike(current.id)}
              aria-label="J'aime"
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-white/80"
            >
              <HugeiconsIcon icon={FavouriteIcon} size={22} strokeWidth={1.75} className={isLiked(current.id) ? "fill-violet-300 text-violet-300" : ""} />
            </button>
          </div>

          <input
            type="range"
            min={0}
            max={effectiveDuration || 1}
            step={0.1}
            value={Math.min(currentTime, effectiveDuration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            className="player-range mt-5 h-1 w-full cursor-pointer appearance-none rounded-full"
            style={{ background: `linear-gradient(to right, rgb(255 255 255 / 90%) ${pct}%, rgb(255 255 255 / 20%) ${pct}%)` }}
            aria-label="Progression"
          />
          <div className="mt-2 flex justify-between font-mono text-[12px] text-white/50">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(effectiveDuration)}</span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button type="button" onClick={toggleShuffle} aria-label="Lecture aléatoire" className={`flex size-11 items-center justify-center ${shuffle ? "text-violet-300" : "text-white/70"}`}>
              <HugeiconsIcon icon={ShuffleIcon} size={20} strokeWidth={1.75} />
            </button>
            <button type="button" onClick={previous} aria-label="Précédent" className="flex size-12 items-center justify-center text-white">
              <HugeiconsIcon icon={PreviousIcon} size={26} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Lecture"}
              className="flex size-16 items-center justify-center rounded-full bg-white text-black active:scale-[0.95]"
            >
              <HugeiconsIcon icon={isPlaying ? PauseIcon : PlayIcon} size={28} strokeWidth={2} />
            </button>
            <button type="button" onClick={next} aria-label="Suivant" className="flex size-12 items-center justify-center text-white">
              <HugeiconsIcon icon={NextIcon} size={26} strokeWidth={2} />
            </button>
            <button type="button" onClick={cycleRepeat} aria-label="Répéter" className={`flex size-11 items-center justify-center ${repeat !== "off" ? "text-violet-300" : "text-white/70"}`}>
              <HugeiconsIcon icon={repeat === "one" ? RepeatOne01Icon : RepeatIcon} size={20} strokeWidth={1.75} />
            </button>
          </div>

          {preview && releaseId ? (
            <Link
              href={`/discover/release/${releaseId}/acheter`}
              onClick={closeFullscreen}
              className="mt-6 flex h-12 items-center justify-center gap-2 rounded-full bg-white/[0.12] text-[15px] font-medium text-white"
            >
              <HugeiconsIcon icon={ShoppingBag01Icon} size={18} strokeWidth={1.75} />
              Acheter pour écouter en entier
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

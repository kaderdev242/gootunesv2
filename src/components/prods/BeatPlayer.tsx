"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMute01Icon,
} from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { Waveform } from "@/components/prods/Waveform";
import { FALLBACK_COVER } from "@/lib/types/music";

export type PlayableBeat = {
  public_id: string;
  title: string;
  cover_url: string | null;
  artist: string;
  artistPublicId?: string | null;
  tempo?: string | null;
  waveform?: number[] | null;
  priceLabel?: string | null;
  /** Le visiteur possède déjà au moins une licence de cette prod. */
  owned?: boolean;
};

type Ctx = {
  current: PlayableBeat | null;
  playing: boolean;
  progress: number;
  duration: number;
  volume: number;
  muted: boolean;
  play: (beat: PlayableBeat, queue?: PlayableBeat[]) => void;
  toggle: () => void;
  seek: (ratio: number) => void;
  next: () => void;
  prev: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
};

const BeatPlayerContext = createContext<Ctx | null>(null);
const VOLUME_KEY = "gt-prods-volume";

export function useBeatPlayer() {
  const ctx = useContext(BeatPlayerContext);
  if (!ctx) throw new Error("useBeatPlayer hors BeatPlayerProvider");
  return ctx;
}

/** Durée de l'extrait public (identique à PRODS_DEMO_SECONDS côté serveur). */
export const PREVIEW_SECONDS = 60;

/** Forme d'onde recadrée sur l'extrait : les pics couvrent le morceau entier. */
export function previewPeaks(peaks: number[] | null | undefined, fullSeconds: number | null | undefined) {
  if (!peaks?.length || !fullSeconds || fullSeconds <= PREVIEW_SECONDS) return peaks ?? null;
  return peaks.slice(0, Math.max(1, Math.round((peaks.length * PREVIEW_SECONDS) / fullSeconds)));
}

export function formatTime(s: number) {
  if (!Number.isFinite(s) || s <= 0) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function readVolume() {
  try {
    const v = Number(window.localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(v) && v > 0 && v <= 1 ? v : 0.8;
  } catch {
    return 0.8;
  }
}

/** Lecteur des démos taguées — indépendant du lecteur Discover. */
export function BeatPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<PlayableBeat | null>(null);
  const [queue, setQueue] = useState<PlayableBeat[]>([]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);
  /** Extrait terminé : propose d'acheter la prod pour l'écouter en entier. */
  const [paywall, setPaywall] = useState<PlayableBeat | null>(null);

  useEffect(() => {
    const v = readVolume();
    if (audioRef.current) audioRef.current.volume = v;
    // Lecture d'un réglage navigateur au montage (localStorage indisponible côté serveur).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVolumeState(v);
  }, []);

  const load = useCallback((beat: PlayableBeat) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = `/api/prods/demo/${beat.public_id}`;
    setCurrent(beat);
    setProgress(0);
    setDuration(0);
    void audio.play().catch(() => setPlaying(false));
  }, []);

  const play = useCallback(
    (beat: PlayableBeat, q?: PlayableBeat[]) => {
      if (q?.length) setQueue(q);
      if (current?.public_id === beat.public_id) {
        const audio = audioRef.current;
        if (audio?.paused) void audio.play();
        else audio?.pause();
        return;
      }
      load(beat);
    },
    [current?.public_id, load],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!current || !queue.length) return;
      const i = queue.findIndex((b) => b.public_id === current.public_id);
      const target = queue[i + dir];
      if (target) load(target);
    },
    [current, queue, load],
  );

  const setVolume = useCallback((v: number) => {
    const val = Math.min(1, Math.max(0, v));
    const audio = audioRef.current;
    if (audio) {
      audio.volume = val;
      audio.muted = val === 0;
    }
    setVolumeState(val);
    setMuted(val === 0);
    try {
      if (val > 0) window.localStorage.setItem(VOLUME_KEY, String(val));
    } catch {
      /* stockage indisponible */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      current,
      playing,
      progress,
      duration,
      volume,
      muted,
      play,
      toggle: () => {
        const audio = audioRef.current;
        if (!audio || !current) return;
        if (audio.paused) void audio.play();
        else audio.pause();
      },
      seek: (ratio) => {
        const audio = audioRef.current;
        if (audio && duration) audio.currentTime = ratio * duration;
      },
      next: () => step(1),
      prev: () => step(-1),
      setVolume,
      toggleMute: () => {
        const audio = audioRef.current;
        if (!audio) return;
        const m = !muted;
        audio.muted = m;
        setMuted(m);
        if (!m && volume === 0) setVolume(0.8);
      },
    }),
    [current, playing, progress, duration, volume, muted, play, step, setVolume],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.code !== "Space" || !current || t?.closest("input, textarea, select, button, [role=slider]")) return;
      e.preventDefault();
      value.toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, value]);

  return (
    <BeatPlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => (current && !current.owned ? setPaywall(current) : step(1))}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
      />
      {current ? <PlayerBar /> : null}
      {paywall ? (
        <PreviewEndedModal
          beat={paywall}
          onClose={() => setPaywall(null)}
          onNext={() => {
            setPaywall(null);
            step(1);
          }}
        />
      ) : null}
    </BeatPlayerContext.Provider>
  );
}

/** Fin de l'extrait de 60 s : invitation à acheter la prod. */
function PreviewEndedModal({
  beat,
  onClose,
  onNext,
}: {
  beat: PlayableBeat;
  onClose: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-ended-title"
        className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#151517] p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mx-auto size-28 overflow-hidden rounded-xl bg-white/5">
          <AppImage src={beat.cover_url || FALLBACK_COVER} alt="" fill sizes="112px" className="object-cover" />
        </div>
        <p className="mt-5 text-sm text-white/50">Fin de l&apos;extrait de 60 secondes</p>
        <h2 id="preview-ended-title" className="mt-1 text-xl font-semibold text-white">
          Achète ce beat pour l&apos;écouter en entier
        </h2>
        <p className="mt-2 truncate text-sm text-white/60">
          {beat.title} · {beat.artist}
        </p>
        <a
          href={`/prods/b/${beat.public_id}#licences`}
          className="mt-6 flex h-11 items-center justify-center rounded-xl bg-white text-sm font-semibold text-black transition-colors hover:bg-white/90"
        >
          {beat.priceLabel ? `Acheter · ${beat.priceLabel}` : "Voir les licences"}
        </a>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onNext}
            className="h-11 flex-1 rounded-xl text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Prod suivante
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerBar() {
  const p = useBeatPlayer();
  const { current } = p;
  if (!current) return null;
  const ratio = p.duration ? p.progress / p.duration : 0;
  const volIcon = p.muted || p.volume === 0 ? VolumeMute01Icon : p.volume < 0.5 ? VolumeLowIcon : VolumeHighIcon;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#0e0e10]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      {/* Mobile : progression fine en haut de la barre */}
      <div className="h-0.5 bg-white/10 md:hidden">
        <div className="h-full bg-white/90" style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center gap-4 px-4 md:px-6">
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={p.prev}
            className="hidden size-8 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white sm:flex"
            aria-label="Prod précédente"
          >
            <HugeiconsIcon icon={PreviousIcon} size={16} />
          </button>
          <button
            type="button"
            onClick={p.toggle}
            className="flex size-10 items-center justify-center rounded-full bg-white text-black transition-transform active:scale-95"
            aria-label={p.playing ? "Pause" : "Lecture"}
          >
            <HugeiconsIcon icon={p.playing ? PauseIcon : PlayIcon} size={18} />
          </button>
          <button
            type="button"
            onClick={p.next}
            className="hidden size-8 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white sm:flex"
            aria-label="Prod suivante"
          >
            <HugeiconsIcon icon={NextIcon} size={16} />
          </button>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3 md:w-[280px] md:flex-none">
          <Link href={`/prods/b/${current.public_id}`} className="relative size-11 shrink-0 overflow-hidden rounded-md bg-white/5">
            <AppImage src={current.cover_url || FALLBACK_COVER} alt="" fill sizes="44px" className="object-cover" />
          </Link>
          <div className="min-w-0">
            <Link href={`/prods/b/${current.public_id}`} className="block truncate text-sm font-medium text-white hover:underline">
              {current.title}
            </Link>
            <p className="truncate text-xs text-white/50">
              {current.artistPublicId ? (
                <Link href={`/prods/p/${current.artistPublicId}`} className="hover:text-white">
                  {current.artist}
                </Link>
              ) : (
                current.artist
              )}
              {current.tempo ? <span className="font-mono text-white/35"> · {current.tempo}</span> : null}
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
          <span className="w-10 text-right font-mono text-[11px] tabular-nums text-white/50">{formatTime(p.progress)}</span>
          <Waveform peaks={current.waveform} progress={ratio} onSeek={p.seek} height={32} className="min-w-0 flex-1" />
          <span className="w-10 font-mono text-[11px] tabular-nums text-white/50">{formatTime(p.duration)}</span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={p.toggleMute}
              className="flex size-8 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label={p.muted ? "Réactiver le son" : "Couper le son"}
            >
              <HugeiconsIcon icon={volIcon} size={18} />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((p.muted ? 0 : p.volume) * 100)}
              onChange={(e) => p.setVolume(Number(e.target.value) / 100)}
              aria-label="Volume"
              className="h-1 w-24 cursor-pointer accent-white"
            />
          </div>
          {current.owned ? (
            <a
              href="/prods/achats"
              className="hidden h-9 items-center rounded-lg border border-white/[0.14] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.06] sm:inline-flex"
            >
              Mes fichiers
            </a>
          ) : (
            <a
              href={`/prods/b/${current.public_id}#licences`}
              className="hidden h-9 items-center rounded-lg bg-white px-3.5 text-[13px] font-medium text-black transition-colors hover:bg-white/90 sm:inline-flex"
            >
              {current.priceLabel ? `Acheter · ${current.priceLabel}` : "Acheter"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

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
} from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { FALLBACK_COVER } from "@/lib/types/music";

export type PlayableBeat = {
  public_id: string;
  title: string;
  cover_url: string | null;
  artist: string;
};

type Ctx = {
  current: PlayableBeat | null;
  playing: boolean;
  progress: number;
  duration: number;
  play: (beat: PlayableBeat, queue?: PlayableBeat[]) => void;
  toggle: () => void;
  seek: (ratio: number) => void;
  next: () => void;
  prev: () => void;
};

const BeatPlayerContext = createContext<Ctx | null>(null);

export function useBeatPlayer() {
  const ctx = useContext(BeatPlayerContext);
  if (!ctx) throw new Error("useBeatPlayer hors BeatPlayerProvider");
  return ctx;
}

function fmt(s: number) {
  if (!Number.isFinite(s) || s <= 0) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

/** Lecteur des démos taguées — indépendant du lecteur Discover. */
export function BeatPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<PlayableBeat | null>(null);
  const [queue, setQueue] = useState<PlayableBeat[]>([]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

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

  const value = useMemo<Ctx>(
    () => ({
      current,
      playing,
      progress,
      duration,
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
    }),
    [current, playing, progress, duration, play, step],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.code !== "Space" || !current || t?.closest("input, textarea, select, button")) return;
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
        onEnded={() => step(1)}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
      />
      {current ? <PlayerBar /> : null}
    </BeatPlayerContext.Provider>
  );
}

function PlayerBar() {
  const { current, playing, progress, duration, toggle, seek, next, prev } = useBeatPlayer();
  if (!current) return null;
  const ratio = duration ? progress / duration : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div
        className="group h-1 w-full cursor-pointer bg-white/10"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          seek((e.clientX - r.left) / r.width);
        }}
        role="slider"
        aria-label="Position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ratio * 100)}
      >
        <div className="h-full bg-violet-400 transition-[width] duration-200" style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href={`/prods/b/${current.public_id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-white/5">
            <AppImage src={current.cover_url || FALLBACK_COVER} alt="" fill sizes="44px" className="object-cover" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-white">{current.title}</span>
            <span className="block truncate text-xs text-white/50">{current.artist}</span>
          </span>
        </Link>
        <span className="hidden text-xs tabular-nums text-white/40 sm:block">
          {fmt(progress)} / {fmt(duration)}
        </span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={prev} className="flex size-9 items-center justify-center rounded-full text-white/60 hover:text-white" aria-label="Précédent">
            <HugeiconsIcon icon={PreviousIcon} size={18} />
          </button>
          <button
            type="button"
            onClick={toggle}
            className="flex size-11 items-center justify-center rounded-full bg-white text-black transition active:scale-95"
            aria-label={playing ? "Pause" : "Lecture"}
          >
            <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={20} />
          </button>
          <button type="button" onClick={next} className="flex size-9 items-center justify-center rounded-full text-white/60 hover:text-white" aria-label="Suivant">
            <HugeiconsIcon icon={NextIcon} size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

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
import { recordTrackPlay } from "@/lib/actions/analytics";
import { PREVIEW_SECONDS } from "@/lib/audio/constants";
import { FALLBACK_COVER, trackStreamUrl, type Track } from "@/lib/types/music";
import { toastInfo } from "@/lib/toast";

export type AccessMode = "preview" | "full";
export type RepeatMode = "off" | "all" | "one";
/** Onglet du grand player : pochette seule, file d'attente ou crédits. */
export type FullscreenTab = "cover" | "queue" | "credits";

type AccessInfo = {
  access: AccessMode;
  owned: boolean;
  previewSeconds: number;
  streamUrl: string;
  /** Worker Cloudflare (CORS OK). */
  workerUrl?: string;
  /** URL R2 signée — ne pas utiliser dans <audio> (CORS R2). */
  playUrl?: string;
  durationSeconds: number | null;
};

type PlayerContextValue = {
  current: Track | null;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  effectiveDuration: number;
  accessMode: AccessMode;
  owned: boolean;
  previewEnded: boolean;
  previewSeconds: number;
  volume: number;
  muted: boolean;
  isFullscreen: boolean;
  hasTrack: boolean;
  playTrack: (track: Track, queue?: Track[]) => Promise<void>;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  next: () => void;
  previous: () => void;
  openFullscreen: (tab?: FullscreenTab) => void;
  fullscreenTab: FullscreenTab;
  setFullscreenTab: (tab: FullscreenTab) => void;
  closeFullscreen: () => void;
  closePlayer: () => void;
  refreshAccess: () => Promise<void>;
  toggleLike: (trackId: string) => void;
  isLiked: (trackId: string) => boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

const emptyTrack: Track = {
  id: "",
  title: "Aucun titre",
  artist: "Gootunes",
  album: "",
  cover: FALLBACK_COVER,
  duration: "00:00",
  durationSeconds: 0,
  genre: "",
  price: 0,
};

const accessCache = new Map<string, { at: number; data: AccessInfo }>();
// 5 minutes — évite de refaire /play à chaque réécoute dans la session.
const ACCESS_TTL_MS = 5 * 60_000;

/**
 * Préchauffage du cache d'accès.
 * Appeler depuis les listes (visibilité, pointer, focus) et la piste suivante.
 * Silencieux : n'écrit rien en cas d'erreur.
 */
export async function preloadAccess(trackId: string): Promise<void> {
  const cached = accessCache.get(trackId);
  if (cached && Date.now() - cached.at < ACCESS_TTL_MS) return;
  try {
    const res = await fetch(`/api/stream/${trackId}/play`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as AccessInfo;
    if (!data.streamUrl) data.streamUrl = `/api/stream/${trackId}`;
    accessCache.set(trackId, { at: Date.now(), data });
  } catch {
    // Silencieux — c'est juste un préchauffage, pas bloquant.
  }
}

function isAbortError(err: unknown) {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

function isMediaSourceError(err: unknown) {
  return (
    (err instanceof DOMException &&
      (err.name === "NotSupportedError" || err.name === "NotAllowedError")) ||
    (err instanceof Error &&
      (err.name === "NotSupportedError" || err.name === "NotAllowedError"))
  );
}

function isHttpUrl(value?: string | null) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function resolveMediaDuration(audioDuration: number, stored: number) {
  const storedOk = stored > 0 ? stored : 0;
  const audioOk =
    Number.isFinite(audioDuration) && audioDuration > 0 ? audioDuration : 0;

  if (storedOk > 0 && audioOk > 0) {
    // Stream tronqué / preview : ne pas afficher 0:20 à la place de la vraie durée
    if (audioOk + 0.5 < storedOk * 0.5) return storedOk;
    // Worker qui annonce maxBytes (1 Go) → Chrome estime ~741 min au lieu de 4:30
    if (audioOk > storedOk * 2 + 30) return storedOk;
    return audioOk;
  }

  // Sans durée DB, ignorer les estimations absurdes (Content-Length 1 Go).
  if (audioOk > 60 * 60) return 0;
  return audioOk || storedOk;
}

/** URL lisible par <audio> : worker (CORS) ou proxy same-origin — jamais R2 signé. */
function resolvePlaybackUrl(info: AccessInfo, trackId: string) {
  if (isHttpUrl(info.workerUrl)) return info.workerUrl as string;
  if (info.streamUrl) return info.streamUrl;
  return trackStreamUrl(trackId);
}

async function safePlay(audio: HTMLAudioElement) {
  try {
    await audio.play();
    return true;
  } catch (err) {
    if (isAbortError(err) || isMediaSourceError(err)) return false;
    throw err;
  }
}

function waitForEvent(
  audio: HTMLAudioElement,
  event: "canplay" | "loadedmetadata",
  timeoutMs: number,
  gen: number,
  playGenRef: { current: number },
) {
  return new Promise<void>((resolve) => {
    if (audio.readyState >= (event === "canplay" ? 2 : 1)) {
      resolve();
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      audio.removeEventListener(event, onReady);
      window.clearTimeout(timer);
      resolve();
    };
    const onReady = () => finish();
    const timer = window.setTimeout(finish, timeoutMs);
    audio.addEventListener(event, onReady);
    if (gen !== playGenRef.current) finish();
  });
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** Fin d'un titre complet : répétition ou titre suivant (mis à jour plus bas). */
  const onTrackEndRef = useRef<(() => void) | null>(null);
  const playGenRef = useRef(0);
  const currentRef = useRef<Track | null>(null);
  const accessModeRef = useRef<AccessMode>("preview");
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [accessMode, setAccessMode] = useState<AccessMode>("preview");
  const [owned, setOwned] = useState(false);
  const [previewEnded, setPreviewEnded] = useState(false);
  const [previewSeconds, setPreviewSeconds] = useState(PREVIEW_SECONDS);
  const [volume, setVolumeState] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());
  const recordedRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);

  const storedTrackDuration = current?.durationSeconds || 0;
  const effectiveDuration =
    accessMode === "preview"
      ? Math.min(duration || previewSeconds, previewSeconds)
      : resolveMediaDuration(duration, storedTrackDuration) ||
        storedTrackDuration ||
        duration;

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    accessModeRef.current = accessMode;
  }, [accessMode]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onTime = () => {
      const t = audio.currentTime;
      const mode = (audio.dataset.access as AccessMode) || "preview";
      const limit = Number(audio.dataset.previewSeconds || PREVIEW_SECONDS);

      if (mode === "preview" && t >= limit - 0.05) {
        audio.pause();
        audio.currentTime = limit;
        setCurrentTime(limit);
        setIsPlaying(false);
        setPreviewEnded(true);
        return;
      }
      setCurrentTime(t);
    };

    const applyResolvedDuration = () => {
      const mode = (audio.dataset.access as AccessMode) || "preview";
      const stored = Number(audio.dataset.storedDuration || 0);
      const resolved = resolveMediaDuration(audio.duration, stored);
      if (resolved <= 0) return;
      if (mode === "preview") {
        setDuration(
          Math.min(
            resolved,
            Number(audio.dataset.previewSeconds || PREVIEW_SECONDS),
          ),
        );
      } else {
        setDuration(resolved);
      }
    };

    const fallbackToProxy = () => {
      const trackId = audio.dataset.trackId;
      if (!trackId || audio.dataset.fallback === "1") return false;
      const proxy = trackStreamUrl(trackId);
      if (audio.dataset.playUrl === proxy) return false;
      audio.dataset.fallback = "1";
      const t = audio.currentTime;
      audio.dataset.playUrl = proxy;
      audio.src = proxy;
      audio.load();
      const resume = () => {
        try {
          if (t > 0.4) audio.currentTime = t;
        } catch {
          /* ignore */
        }
        void safePlay(audio);
      };
      audio.addEventListener("canplay", resume, { once: true });
      return true;
    };

    const onMeta = () => applyResolvedDuration();

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      const mode = (audio.dataset.access as AccessMode) || "preview";
      const stored = Number(audio.dataset.storedDuration || 0);
      if (
        mode === "full" &&
        stored > 0 &&
        audio.currentTime + 1.5 < stored * 0.85
      ) {
        if (fallbackToProxy()) return;
      }
      setIsPlaying(false);
      if (mode === "preview") {
        setPreviewEnded(true);
        return;
      }
      // Titre complet terminé : répétition ou titre suivant.
      onTrackEndRef.current?.();
    };
    const onError = () => {
      fallbackToProxy();
    };
    let waitingTimer: number | null = null;
    const onWaiting = () => {
      if (waitingTimer != null) window.clearTimeout(waitingTimer);
      waitingTimer = window.setTimeout(() => {
        waitingTimer = null;
        fallbackToProxy();
      }, 4000);
    };
    const onPlaying = () => {
      if (waitingTimer != null) {
        window.clearTimeout(waitingTimer);
        waitingTimer = null;
      }
      setIsPlaying(true);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);

    return () => {
      if (waitingTimer != null) window.clearTimeout(waitingTimer);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const loadAccess = useCallback(async (trackId: string, bust = false) => {
    const cached = accessCache.get(trackId);
    if (!bust && cached && Date.now() - cached.at < ACCESS_TTL_MS) {
      return cached.data;
    }
    // /play = auth + URL R2 signée (évite le proxy lent).
    const res = await fetch(`/api/stream/${trackId}/play`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Accès lecture impossible");
    const data = (await res.json()) as AccessInfo;
    if (!data.streamUrl) {
      data.streamUrl = `/api/stream/${trackId}`;
    }
    accessCache.set(trackId, { at: Date.now(), data });
    return data;
  }, []);

  const applyAccess = useCallback((audio: HTMLAudioElement, info: AccessInfo) => {
    audio.dataset.access = info.access;
    audio.dataset.previewSeconds = String(info.previewSeconds);
    audio.dataset.owned = info.owned ? "1" : "0";
    audio.dataset.storedDuration = String(info.durationSeconds || 0);
    setAccessMode(info.access);
    setOwned(info.owned);
    setPreviewSeconds(info.previewSeconds);
    if (info.durationSeconds && info.durationSeconds > 0) {
      setDuration(
        info.access === "preview"
          ? Math.min(info.durationSeconds, info.previewSeconds)
          : info.durationSeconds,
      );
    }
    accessModeRef.current = info.access;
  }, []);

  const playTrack = useCallback(
    async (track: Track, nextQueue?: Track[]) => {
      const audio = audioRef.current;
      if (!audio) return;
      const gen = ++playGenRef.current;
      const proxyUrl = trackStreamUrl(track.id);

      try {
        if (nextQueue) setQueue(nextQueue);
        setPreviewEnded(false);
        setCurrentTime(0);
        setCurrent({ ...track, audioUrl: proxyUrl });
        currentRef.current = { ...track, audioUrl: proxyUrl };

        // Mode sûr par défaut pendant le fetch
        audio.dataset.access = "preview";
        audio.dataset.previewSeconds = String(PREVIEW_SECONDS);

        const info = await loadAccess(track.id);
        if (gen !== playGenRef.current) return;

        const mediaUrl = resolvePlaybackUrl(info, track.id);

        applyAccess(audio, info);
        const storedDuration =
          info.durationSeconds || track.durationSeconds || 0;
        audio.dataset.storedDuration = String(storedDuration);
        audio.dataset.fallback = "";
        setCurrent({
          ...track,
          owned: info.owned,
          audioUrl: mediaUrl,
          durationSeconds: storedDuration,
        });

        const alreadyLoaded =
          audio.dataset.trackId === track.id &&
          audio.dataset.playUrl === mediaUrl &&
          !!audio.src;
        let pendingPlay: Promise<boolean> | null = null;
        if (!alreadyLoaded) {
          audio.pause();
          audio.dataset.trackId = track.id;
          audio.dataset.playUrl = mediaUrl;
          audio.src = mediaUrl;
          audio.load();
          // play() tout de suite, encore dans le geste de l'utilisateur :
          // le navigateur démarre dès qu'il a assez de données, et Safari
          // n'annule pas la lecture si le réseau est lent.
          pendingPlay = safePlay(audio);
          await waitForEvent(audio, "loadedmetadata", 3000, gen, playGenRef);
          if (gen !== playGenRef.current) return;
        }

        let started = await (pendingPlay ?? safePlay(audio));
        if (gen !== playGenRef.current) return;

        if (!started && mediaUrl !== proxyUrl) {
          audio.pause();
          audio.dataset.playUrl = proxyUrl;
          audio.src = proxyUrl;
          audio.load();
          await waitForEvent(audio, "loadedmetadata", 3000, gen, playGenRef);
          if (gen !== playGenRef.current) return;
          started = await safePlay(audio);
        }

        if (!started) {
          await new Promise((r) => window.setTimeout(r, 120));
          if (gen !== playGenRef.current) return;
          const retry = await safePlay(audio);
          if (!retry) {
            toastInfo("Lecture bloquée", "Clique encore une fois sur lecture.");
            return;
          }
        }
        setIsPlaying(true);

        const list = nextQueue;
        if (list?.length) {
          const i = list.findIndex((t) => t.id === track.id);
          if (i >= 0 && i < list.length - 1) {
            void preloadAccess(list[i + 1].id);
          }
        }

        if (
          track.releaseId &&
          track.ownerId &&
          recordedRef.current !== track.id
        ) {
          recordedRef.current = track.id;
          // Pas de router.refresh() : ça remonte les pages et coupe la lecture
          void recordTrackPlay({
            trackId: track.id,
            releaseId: track.releaseId,
            ownerId: track.ownerId,
          });
        }
      } catch (err) {
        if (isAbortError(err) || gen !== playGenRef.current) return;
        toastInfo("Lecture impossible", "Réessaie dans un instant.");
      }
    },
    [applyAccess, loadAccess],
  );

  const closePlayer = useCallback(() => {
    playGenRef.current += 1;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      delete audio.dataset.trackId;
      delete audio.dataset.access;
      delete audio.dataset.owned;
      delete audio.dataset.playUrl;
    }
    setCurrent(null);
    currentRef.current = null;
    setQueue([]);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPreviewEnded(false);
    setIsFullscreen(false);
    setAccessMode("preview");
    setOwned(false);
    recordedRef.current = null;
  }, []);

  const refreshAccess = useCallback(async () => {
    const track = currentRef.current;
    const audio = audioRef.current;
    if (!track || !audio) return;

    const gen = ++playGenRef.current;
    const shouldResume = isPlayingRef.current;
    const t = audio.currentTime;

    try {
      const info = await loadAccess(track.id, true);
      if (gen !== playGenRef.current) return;

      const prevAccess = audio.dataset.access || "preview";
      const mediaUrl = resolvePlaybackUrl(info, track.id);
      applyAccess(audio, info);
      setPreviewEnded(false);
      setCurrent((c) =>
        c ? { ...c, owned: info.owned, audioUrl: mediaUrl } : c,
      );

      // Recharge si mode d'accès change ou si l'URL signée a changé
      if (
        prevAccess !== info.access ||
        audio.dataset.trackId !== track.id ||
        audio.dataset.playUrl !== mediaUrl
      ) {
        audio.pause();
        audio.dataset.trackId = track.id;
        audio.dataset.playUrl = mediaUrl;
        audio.src = mediaUrl;
        audio.load();
        await waitForEvent(audio, "loadedmetadata", 8000, gen, playGenRef);
        if (gen !== playGenRef.current) return;
        try {
          audio.currentTime = Math.min(
            t,
            info.access === "full" ? Number.POSITIVE_INFINITY : info.previewSeconds,
          );
        } catch {
          /* ignore */
        }
        if (shouldResume) {
          const started = await safePlay(audio);
          if (started) setIsPlaying(true);
        }
      }
    } catch (err) {
      if (isAbortError(err) || gen !== playGenRef.current) return;
    }
  }, [applyAccess, loadAccess]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentRef.current) return;

    if (accessModeRef.current === "preview" && previewEnded) {
      toastInfo(
        "Aperçu terminé",
        "Achète ce titre pour l'écouter en entier.",
      );
      return;
    }

    if (audio.paused) void safePlay(audio);
    else audio.pause();
  }, [previewEnded]);

  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio || !currentRef.current) return;
      const mode = accessModeRef.current;
      const limit =
        mode === "preview" ? previewSeconds : audio.duration || duration;
      const next = Math.max(0, Math.min(time, limit || 0));
      if (mode === "preview" && next >= previewSeconds) {
        audio.currentTime = previewSeconds;
        audio.pause();
        setPreviewEnded(true);
        setIsPlaying(false);
        return;
      }
      audio.currentTime = next;
      setCurrentTime(next);
      if (mode === "preview" && next < previewSeconds) {
        setPreviewEnded(false);
      }
    },
    [duration, previewSeconds],
  );

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)));
    setMuted(false);
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const [fullscreenTab, setFullscreenTab] = useState<FullscreenTab>("cover");
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");

  /** Titre suivant ; `auto` = fin de lecture (respecte « répéter : non »). */
  const advance = useCallback(
    (auto: boolean) => {
      const cur = currentRef.current;
      if (!cur || !queue.length) return;
      const index = queue.findIndex((t) => t.id === cur.id);
      let item: Track | undefined;
      if (shuffle && queue.length > 1) {
        const others = queue.filter((t) => t.id !== cur.id);
        item = others[Math.floor(Math.random() * others.length)];
      } else {
        const atEnd = index === queue.length - 1;
        if (auto && atEnd && repeat === "off") return;
        item = queue[(index + 1) % queue.length];
      }
      if (item) void playTrack(item, queue);
    },
    [playTrack, queue, repeat, shuffle],
  );

  const next = useCallback(() => advance(false), [advance]);

  useEffect(() => {
    onTrackEndRef.current = () => {
      const audio = audioRef.current;
      if (repeat === "one" && audio) {
        audio.currentTime = 0;
        void audio.play().catch(() => undefined);
        return;
      }
      advance(true);
    };
  }, [advance, repeat]);

  const toggleShuffle = useCallback(() => setShuffle((v) => !v), []);
  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    [],
  );

  const previous = useCallback(() => {
    const cur = currentRef.current;
    if (!cur || !queue.length) return;
    const index = queue.findIndex((t) => t.id === cur.id);
    const item = queue[(index - 1 + queue.length) % queue.length];
    if (item) void playTrack(item, queue);
  }, [playTrack, queue]);

  const toggleLike = useCallback((trackId: string) => {
    setLikedIds((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(trackId)) nextSet.delete(trackId);
      else nextSet.add(trackId);
      return nextSet;
    });
  }, []);

  const isLiked = useCallback(
    (trackId: string) => likedIds.has(trackId),
    [likedIds],
  );

  const value = useMemo<PlayerContextValue>(
    () => ({
      current,
      queue,
      isPlaying,
      currentTime,
      duration,
      effectiveDuration,
      accessMode,
      owned,
      previewEnded,
      previewSeconds,
      volume,
      muted,
      isFullscreen,
      hasTrack: !!current,
      playTrack,
      togglePlay,
      seek,
      setVolume,
      toggleMute,
      next,
      previous,
      openFullscreen: (tab?: FullscreenTab) => {
        setFullscreenTab(tab ?? "cover");
        setIsFullscreen(true);
      },
      fullscreenTab,
      setFullscreenTab,
      closeFullscreen: () => setIsFullscreen(false),
      closePlayer,
      refreshAccess,
      toggleLike,
      isLiked,
      shuffle,
      repeat,
      toggleShuffle,
      cycleRepeat,
    }),
    [
      fullscreenTab,
      shuffle,
      repeat,
      toggleShuffle,
      cycleRepeat,
      accessMode,
      closePlayer,
      current,
      currentTime,
      duration,
      effectiveDuration,
      isFullscreen,
      isLiked,
      isPlaying,
      muted,
      next,
      owned,
      playTrack,
      previewEnded,
      previewSeconds,
      previous,
      queue,
      refreshAccess,
      seek,
      setVolume,
      toggleLike,
      toggleMute,
      togglePlay,
      volume,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <span
        className="sr-only"
        data-player-track={current?.id || emptyTrack.id}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

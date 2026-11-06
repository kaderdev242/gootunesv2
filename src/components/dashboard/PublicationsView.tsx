"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AppImage } from "@/components/media/AppImage";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Delete02Icon,
  PauseIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { DashboardPlayer } from "@/components/dashboard/DashboardPlayer";
import { PublishTypeModal } from "@/components/dashboard/PublishTypeModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteRelease, deleteTrack } from "@/lib/actions/publish";
import type { CreatorBase } from "@/lib/dashboard/paths";
import { formatDate, formatMoney } from "@/lib/format";
import { toUserError } from "@/lib/errors";
import { toastError, toastSuccess } from "@/lib/toast";
import type { ReleaseType } from "@/lib/supabase/database.types";

type TrackRow = {
  id: string;
  title: string;
  audio_url: string | null;
  track_number: number;
};

type ReleaseRow = {
  id: string;
  title: string;
  type: ReleaseType;
  status: string;
  cover_url: string | null;
  price_fcfa: number;
  created_at: string;
  artists: { stage_name?: string } | null;
  tracks: TrackRow[];
};

type ConfirmState =
  | { kind: "release"; release: ReleaseRow }
  | { kind: "track"; trackId: string; title: string }
  | null;

export function PublicationsView({
  basePath,
  releases,
  country,
}: {
  basePath: CreatorBase;
  releases: ReleaseRow[];
  country?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(searchParams.get("nouveau") === "1");
  // Le bouton « Publier » de l'en-tête ouvre le choix single / album,
  // y compris quand on est déjà sur cette page.
  const query = searchParams.toString();
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    if (searchParams.get("nouveau") === "1") setModalOpen(true);
  }
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [pending, startTransition] = useTransition();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeMeta = (() => {
    for (const release of releases) {
      const track = release.tracks.find((t) => t.id === activeTrackId);
      if (track) {
        return {
          track,
          release,
          artist: release.artists?.stage_name || null,
          coverUrl: release.cover_url,
        };
      }
    }
    return null;
  })();

  function stopPlayer() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setIsPlaying(false);
    setActiveTrackId(null);
    setCurrentTime(0);
    setDuration(0);
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeMeta?.track.id) return;

    const streamUrl = `/api/stream/${activeMeta.track.id}`;
    if (!audio.src.endsWith(streamUrl)) {
      audio.src = streamUrl;
      setCurrentTime(0);
      setDuration(0);
    }

    if (isPlaying) {
      void audio.play().catch(() => {
        toastError("Lecture impossible", "Une erreur s'est produite lors de l'accès au fichier.");
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [activeMeta, isPlaying]);

  function onSelect(type: ReleaseType) {
    setModalOpen(false);
    router.push(`${basePath}/publier?type=${type}`);
  }

  function playTrack(track: TrackRow) {
    if (!track.audio_url) {
      toastError("Aucun fichier audio pour ce titre.");
      return;
    }
    if (activeTrackId === track.id) {
      setIsPlaying((v) => !v);
      return;
    }
    setActiveTrackId(track.id);
    setIsPlaying(true);
  }

  function runConfirm() {
    if (!confirm) return;

    startTransition(async () => {
      if (confirm.kind === "track") {
        const res = await deleteTrack(confirm.trackId);
        if (res.error) toastError(toUserError(res.error));
        else {
          toastSuccess(res.success || "Titre supprimé.");
          if (activeTrackId === confirm.trackId) stopPlayer();
          router.refresh();
        }
      } else {
        const res = await deleteRelease(confirm.release.id);
        if (res.error) toastError(toUserError(res.error));
        else {
          toastSuccess(res.success || "Publication supprimée.");
          stopPlayer();
          router.refresh();
        }
      }
      setConfirm(null);
    });
  }

  const confirmTitle =
    confirm?.kind === "release"
      ? "Supprimer cette publication ?"
      : "Supprimer ce titre ?";

  const confirmDescription =
    confirm?.kind === "release"
      ? `Supprimer la publication « ${confirm.release.title} » et tous ses titres ? Cette action est définitive.`
      : confirm?.kind === "track"
        ? `Supprimer « ${confirm.title} » ? Cette action est définitive.`
        : "";

  return (
    <div className="mx-auto max-w-5xl">
      <audio
        ref={audioRef}
        className="hidden"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[34px]">Publications</h1>
          <p className="mt-1 text-sm text-white/50">
            Écoute, gère et supprime tes singles & albums.
          </p>
        </div>
        <Button
          className="h-10 rounded-full bg-white hover:bg-white/90 px-5 text-sm font-semibold text-black"
          onPress={() => setModalOpen(true)}
        >
          Nouvelle publication
        </Button>
      </div>

      {!releases.length ? (
        <div className="flex flex-col items-center rounded-[28px] border border-dashed border-white/10 px-6 py-16 text-center">
          <AppImage
            src="/music-upload.png"
            alt=""
            width={140}
            height={140}
            className="mb-5 size-[140px] object-contain"
            priority
          />
          <p className="text-base font-semibold text-white">Aucune publication</p>
          <p className="mt-2 max-w-sm text-sm text-white/50">
            Publie ton premier single ou album pour le rendre disponible aux fans.
          </p>
          <Button
            className="mt-6 h-11 rounded-full bg-white hover:bg-white/90 px-6 font-semibold text-black"
            onPress={() => setModalOpen(true)}
          >
            Publier maintenant
          </Button>
        </div>
      ) : (
        <div className={`flex flex-col gap-3 ${activeMeta ? "pb-36" : ""}`}>
          {releases.map((release) => {
            const tracks = [...(release.tracks || [])].sort(
              (a, b) => a.track_number - b.track_number,
            );
            const isSingle = release.type === "single";
            const firstPlayable = tracks.find((t) => t.audio_url);
            const open = !isSingle && expandedId === release.id;
            const playingThis =
              isPlaying &&
              !!activeTrackId &&
              tracks.some((t) => t.id === activeTrackId);

            return (
              <div
                key={release.id}
                className={`overflow-hidden rounded-[28px] border transition ${
                  playingThis
                    ? "border-white/20 bg-[#0f0f10]"
                    : "border-white/[0.06] bg-[#0f0f10]"
                }`}
              >
                <div className="flex items-center gap-4 p-4">
                  <div className="relative size-[72px] shrink-0 overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
                    {release.cover_url ? (
                      <AppImage
                        src={release.cover_url}
                        alt={release.title}
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate studio-num text-lg font-semibold text-white">
                      {release.title}
                    </p>
                    <p className="mt-0.5 text-xs text-white/50">
                      {isSingle ? "Single" : "Album"} ·{" "}
                      {release.artists?.stage_name} ·{" "}
                      {formatDate(release.created_at)}
                      {!isSingle ? ` · ${tracks.length} titres` : null}
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/85">
                      {formatMoney(Number(release.price_fcfa), country)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {firstPlayable ? (
                      <button
                        type="button"
                        onClick={() => playTrack(firstPlayable)}
                        className="flex size-11 items-center justify-center rounded-full bg-white hover:bg-white/90 text-black transition-[background-color,transform] duration-150 hover:bg-white/90 active:scale-[0.97]"
                        aria-label={playingThis ? "Pause" : "Écouter"}
                      >
                        <HugeiconsIcon
                          icon={
                            playingThis && activeTrackId === firstPlayable.id
                              ? PauseIcon
                              : PlayIcon
                          }
                          size={18}
                        />
                      </button>
                    ) : null}

                    {!isSingle ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(open ? null : release.id)
                        }
                        className="flex size-11 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                        aria-label={
                          open ? "Masquer les titres" : "Voir les titres"
                        }
                      >
                        <HugeiconsIcon
                          icon={ArrowDown01Icon}
                          size={18}
                          className={`transition ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                    ) : null}

                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setConfirm({ kind: "release", release })}
                      className="flex size-11 items-center justify-center rounded-full border border-red-400/20 text-red-400 transition hover:bg-red-500/10"
                      aria-label="Supprimer"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={16} />
                    </button>
                  </div>
                </div>

                {open ? (
                  <ul className="space-y-1 border-t border-white/[0.06] px-3 py-3">
                    {tracks.map((track) => {
                      const playing =
                        isPlaying && activeTrackId === track.id;
                      return (
                        <li
                          key={track.id}
                          className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition ${
                            playing ? "bg-white/[0.06]" : "hover:bg-white/[0.06]"
                          }`}
                        >
                          <span className="w-6 text-center text-xs tabular-nums text-white/40">
                            {String(track.track_number).padStart(2, "0")}
                          </span>
                          <button
                            type="button"
                            className="min-w-0 flex-1 truncate text-left text-sm font-medium text-white"
                            onClick={() => playTrack(track)}
                          >
                            {track.title}
                          </button>
                          <button
                            type="button"
                            onClick={() => playTrack(track)}
                            className="flex size-8 items-center justify-center rounded-full text-white/85 hover:bg-white/[0.06]"
                            aria-label={playing ? "Pause" : "Play"}
                          >
                            <HugeiconsIcon
                              icon={playing ? PauseIcon : PlayIcon}
                              size={14}
                            />
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              setConfirm({
                                kind: "track",
                                trackId: track.id,
                                title: track.title,
                              })
                            }
                            className="flex size-8 items-center justify-center rounded-full text-red-400 hover:bg-red-500/10"
                            aria-label="Supprimer le titre"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={14} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {activeMeta ? (
        <DashboardPlayer
          title={activeMeta.track.title}
          artist={activeMeta.artist}
          coverUrl={activeMeta.coverUrl}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          onToggle={() => playTrack(activeMeta.track)}
          onSeek={(ratio) => {
            const audio = audioRef.current;
            if (!audio || !duration) return;
            audio.currentTime = ratio * duration;
            setCurrentTime(audio.currentTime);
          }}
          onVolumeChange={setVolume}
          onClose={stopPlayer}
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel="Supprimer"
        isPending={pending}
        onConfirm={runConfirm}
      />

      <PublishTypeModal
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        onSelect={onSelect}
      />
    </div>
  );
}

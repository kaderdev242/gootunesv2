"use client";

import { VerifiedBadge } from "@/components/discover/VerifiedBadge";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { formatTime, useBeatPlayer, type PlayableBeat } from "@/components/prods/BeatPlayer";
import { Waveform } from "@/components/prods/Waveform";
import { formatMoney } from "@/lib/format";
import { lowestBeatPrice, tempoLabel } from "@/lib/prods/constants";
import type { PublicBeat } from "@/lib/prods/queries";
import { FALLBACK_COVER } from "@/lib/types/music";

export function toPlayable(b: PublicBeat, country?: string | null): PlayableBeat {
  const from = lowestBeatPrice(b);
  return {
    public_id: b.public_id,
    title: b.title,
    cover_url: b.cover_url,
    artist: b.artists?.stage_name || "Beatmaker",
    artistPublicId: b.artists?.public_id ?? null,
    tempo: tempoLabel(b),
    waveform: b.waveform,
    priceLabel: from ? formatMoney(from, country) : null,
  };
}

/** Indicateur « en lecture » : le seul endroit où le violet apparaît. */
function NowPlaying() {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] origin-bottom rounded-sm bg-violet-300 motion-safe:animate-[eq_900ms_ease-in-out_infinite]"
          style={{ height: "100%", animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

function ArtistLine({ beat }: { beat: PublicBeat }) {
  const a = beat.artists;
  return (
    <span className="flex min-w-0 items-center gap-1 text-[13px] text-white/50">
      {a ? (
        <Link href={`/prods/p/${a.public_id}`} className="truncate transition-colors hover:text-white">
          {a.stage_name}
        </Link>
      ) : (
        <span>Beatmaker</span>
      )}
      {a?.is_verified ? <VerifiedBadge size={14} title="Beatmaker certifié" /> : null}
    </span>
  );
}

/** Grille de pochettes : lecture au survol, étiquette tempo, prix. */
export function BeatGrid({ beats, country }: { beats: PublicBeat[]; country?: string | null }) {
  const { current, playing, play } = useBeatPlayer();
  const queue = beats.map((b) => toPlayable(b, country));

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
      {beats.map((b, i) => {
        const active = current?.public_id === b.public_id;
        const tempo = tempoLabel(b);
        return (
          <li key={b.id} className="min-w-0">
            <div className="group relative aspect-square overflow-hidden rounded-xl bg-white/[0.04]">
              <AppImage
                src={b.cover_url || FALLBACK_COVER}
                alt=""
                fill
                sizes="(min-width:1024px) 20vw, 50vw"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => play(queue[i], queue)}
                className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                  active ? "opacity-100" : "opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                }`}
                aria-label={active && playing ? `Pause ${b.title}` : `Écouter ${b.title}`}
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-white text-black">
                  <HugeiconsIcon icon={active && playing ? PauseIcon : PlayIcon} size={20} />
                </span>
              </button>
              {tempo ? (
                <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[11px] text-white/85 backdrop-blur">
                  {tempo}
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/prods/b/${b.public_id}`} className="flex items-center gap-2 text-[15px] font-medium text-white hover:underline">
                  <span className="truncate">{b.title}</span>
                  {active && playing ? <NowPlaying /> : null}
                </Link>
                <ArtistLine beat={b} />
              </div>
            </div>
            <Link
              href={`/prods/b/${b.public_id}#licences`}
              className="mt-3 inline-flex h-8 items-center rounded-lg bg-white/[0.07] px-3 text-[13px] font-medium tabular-nums text-white transition-colors hover:bg-white/[0.12]"
            >
              {queue[i].priceLabel ? `Dès ${queue[i].priceLabel}` : "Voir"}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Liste classée (tendances, résultats) : rang, pochette, waveform, tempo, genre, prix. */
export function BeatRows({
  beats,
  country,
  ranked = false,
}: {
  beats: PublicBeat[];
  country?: string | null;
  ranked?: boolean;
}) {
  const { current, playing, progress, duration, play, seek } = useBeatPlayer();
  const queue = beats.map((b) => toPlayable(b, country));

  return (
    <ol className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
      {beats.map((b, i) => {
        const active = current?.public_id === b.public_id;
        return (
          <li
            key={b.id}
            className={`grid grid-cols-[auto_44px_minmax(0,1fr)_auto] items-center gap-3 py-3 sm:gap-4 lg:grid-cols-[auto_44px_minmax(0,220px)_minmax(0,1fr)_96px_120px_auto] ${
              active ? "bg-white/[0.03]" : ""
            }`}
          >
            <span className="w-6 text-center font-mono text-[13px] tabular-nums text-white/35">
              {active && playing ? <NowPlaying /> : ranked ? i + 1 : ""}
            </span>
            <button
              type="button"
              onClick={() => play(queue[i], queue)}
              className="group relative size-11 overflow-hidden rounded-md bg-white/5"
              aria-label={active && playing ? `Pause ${b.title}` : `Écouter ${b.title}`}
            >
              <AppImage src={b.cover_url || FALLBACK_COVER} alt="" fill sizes="44px" className="object-cover" />
              <span
                className={`absolute inset-0 flex items-center justify-center bg-black/50 text-white transition-opacity ${
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <HugeiconsIcon icon={active && playing ? PauseIcon : PlayIcon} size={18} />
              </span>
            </button>
            <div className="min-w-0">
              <Link href={`/prods/b/${b.public_id}`} className="block truncate text-[15px] font-medium text-white hover:underline">
                {b.title}
              </Link>
              <ArtistLine beat={b} />
            </div>
            <div className="hidden min-w-0 lg:block">
              <Waveform
                peaks={b.waveform}
                progress={active && duration ? progress / duration : 0}
                onSeek={active ? seek : () => play(queue[i], queue)}
                height={28}
                label={`Waveform ${b.title}`}
              />
            </div>
            <span className="hidden font-mono text-[12px] text-white/50 lg:block">
              {tempoLabel(b) ?? (b.duration_seconds ? formatTime(b.duration_seconds) : "")}
            </span>
            <span className="hidden truncate text-[13px] text-white/50 lg:block">{b.genre}</span>
            <Link
              href={`/prods/b/${b.public_id}#licences`}
              className="inline-flex h-8 items-center justify-self-end rounded-lg bg-white/[0.07] px-3 text-[13px] font-medium tabular-nums text-white transition-colors hover:bg-white/[0.12]"
            >
              {queue[i].priceLabel ?? "Voir"}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/** Bouton lecture de la page d'une prod. */
export function BeatPlayHero({ beat, country }: { beat: PublicBeat; country?: string | null }) {
  const { current, playing, play } = useBeatPlayer();
  const active = current?.public_id === beat.public_id && playing;
  const playable = toPlayable(beat, country);
  return (
    <button
      type="button"
      onClick={() => play(playable, [playable])}
      className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-lg bg-white px-5 text-sm font-medium text-black transition-transform active:scale-[0.98]"
    >
      <HugeiconsIcon icon={active ? PauseIcon : PlayIcon} size={18} />
      {active ? "Pause" : "Écouter la démo"}
    </button>
  );
}

/** Grande waveform de la page d'une prod, liée au lecteur. */
export function BeatDetailWave({ beat, country }: { beat: PublicBeat; country?: string | null }) {
  const { current, progress, duration, play, seek } = useBeatPlayer();
  const active = current?.public_id === beat.public_id;
  const playable = toPlayable(beat, country);
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-right font-mono text-[11px] tabular-nums text-white/45">
        {formatTime(active ? progress : 0)}
      </span>
      <Waveform
        peaks={beat.waveform}
        progress={active && duration ? progress / duration : 0}
        onSeek={active ? seek : () => play(playable, [playable])}
        height={72}
        className="min-w-0 flex-1"
        label={`Waveform ${beat.title}`}
      />
      <span className="w-10 font-mono text-[11px] tabular-nums text-white/45">
        {formatTime(active && duration ? duration : beat.duration_seconds ?? 0)}
      </span>
    </div>
  );
}

"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon, PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { useBeatPlayer, type PlayableBeat } from "@/components/prods/BeatPlayer";
import { formatMoney } from "@/lib/format";
import { lowestBeatPrice } from "@/lib/prods/constants";
import type { PublicBeat } from "@/lib/prods/queries";
import { FALLBACK_COVER } from "@/lib/types/music";

function toPlayable(b: PublicBeat): PlayableBeat {
  return {
    public_id: b.public_id,
    title: b.title,
    cover_url: b.cover_url,
    artist: b.artists?.stage_name || "Beatmaker",
  };
}

/** Liste « beatstore » : une ligne par prod, lecture directe de la démo. */
export function BeatList({
  beats,
  country,
  emptyTitle = "Aucune prod ne correspond",
  emptyHint = "Essaie un autre genre ou retire un filtre.",
}: {
  beats: PublicBeat[];
  country?: string | null;
  emptyTitle?: string;
  emptyHint?: string;
}) {
  const { current, playing, play } = useBeatPlayer();
  const queue = beats.map(toPlayable);

  if (!beats.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/10 px-6 py-16 text-center">
        <p className="font-semibold text-white">{emptyTitle}</p>
        <p className="mt-1 text-sm text-white/50">{emptyHint}</p>
      </div>
    );
  }

  return (
    <ol className="divide-y divide-white/[0.06] overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0a0a0a]">
      <li className="hidden grid-cols-[48px_minmax(0,1fr)_72px_80px_minmax(0,140px)_120px] items-center gap-4 px-4 py-3 text-[11px] font-medium text-white/35 md:grid">
        <span />
        <span>Titre</span>
        <span>BPM</span>
        <span>Tonalité</span>
        <span>Genre</span>
        <span className="text-right">Prix</span>
      </li>
      {beats.map((b, i) => {
        const active = current?.public_id === b.public_id;
        const isPlaying = active && playing;
        const from = lowestBeatPrice(b);
        return (
          <li
            key={b.id}
            className={`grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 transition md:grid-cols-[48px_minmax(0,1fr)_72px_80px_minmax(0,140px)_120px] ${
              active ? "bg-violet-400/[0.07]" : "hover:bg-white/[0.03]"
            }`}
          >
            <button
              type="button"
              onClick={() => play(queue[i], queue)}
              className="group relative size-12 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10"
              aria-label={isPlaying ? `Pause ${b.title}` : `Écouter ${b.title}`}
            >
              <AppImage src={b.cover_url || FALLBACK_COVER} alt="" fill sizes="48px" className="object-cover" />
              <span
                className={`absolute inset-0 flex items-center justify-center bg-black/45 text-white transition ${
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <HugeiconsIcon icon={isPlaying ? PauseIcon : PlayIcon} size={20} />
              </span>
            </button>

            <div className="min-w-0">
              <Link
                href={`/prods/b/${b.public_id}`}
                className={`block truncate text-[15px] font-semibold hover:underline ${active ? "text-violet-300" : "text-white"}`}
              >
                {b.title}
              </Link>
              <p className="flex items-center gap-1 truncate text-[13px] text-white/50">
                {b.artists?.stage_name || "Beatmaker"}
                {b.artists?.is_verified ? (
                  <HugeiconsIcon icon={CheckmarkBadge01Icon} size={13} className="shrink-0 text-violet-300" />
                ) : null}
                <span className="md:hidden">
                  {[b.bpm && ` · ${b.bpm} BPM`, b.musical_key && ` · ${b.musical_key}`].filter(Boolean).join("")}
                </span>
              </p>
            </div>

            <span className="hidden text-sm tabular-nums text-white/70 md:block">{b.bpm ?? "—"}</span>
            <span className="hidden text-sm text-white/70 md:block">{b.musical_key ?? "—"}</span>
            <span className="hidden truncate md:block">
              {b.genre ? (
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/70">{b.genre}</span>
              ) : null}
            </span>
            <Link
              href={`/prods/b/${b.public_id}`}
              className="justify-self-end rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-black transition hover:bg-white/90"
            >
              {from ? `Dès ${formatMoney(from, country)}` : "Voir"}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/** Gros bouton lecture (page détail). */
export function BeatPlayHero({ beat }: { beat: PublicBeat }) {
  const { current, playing, play } = useBeatPlayer();
  const active = current?.public_id === beat.public_id && playing;
  return (
    <button
      type="button"
      onClick={() => play(toPlayable(beat), [toPlayable(beat)])}
      className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]"
    >
      <HugeiconsIcon icon={active ? PauseIcon : PlayIcon} size={18} />
      {active ? "Pause" : "Écouter la démo"}
    </button>
  );
}

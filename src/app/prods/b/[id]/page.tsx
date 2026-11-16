import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { CoverAtmosphere } from "@/components/discover/CoverAtmosphere";
import { AppImage } from "@/components/media/AppImage";
import { BeatList, BeatPlayHero } from "@/components/prods/BeatList";
import { formatMoney } from "@/lib/format";
import { beatPriceFor, LICENSE_ORDER, LICENSES } from "@/lib/prods/constants";
import { getBeatByPublicId, getViewerCountry, listBeatsByArtist } from "@/lib/prods/queries";
import { FALLBACK_COVER } from "@/lib/types/music";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const beat = await getBeatByPublicId(id);
  if (!beat) return { title: "Prod introuvable" };
  const by = beat.artists?.stage_name || "Beatmaker";
  return {
    title: `${beat.title} — prod de ${by}`,
    description: `Instrumental ${beat.genre || ""} ${beat.bpm ? `${beat.bpm} BPM` : ""} par ${by}. Licences MP3, WAV et stems sur Gootunes Prods.`,
    openGraph: { images: beat.cover_url ? [{ url: beat.cover_url }] : undefined },
  };
}

function fmtDuration(s: number | null) {
  if (!s) return null;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default async function BeatDetailPage({ params }: Props) {
  const { id } = await params;
  const beat = await getBeatByPublicId(id);
  if (!beat) notFound();

  const [country, more] = await Promise.all([
    getViewerCountry(),
    beat.artists ? listBeatsByArtist(beat.artists.id, beat.id) : Promise.resolve([]),
  ]);
  const cover = beat.cover_url || FALLBACK_COVER;
  const by = beat.artists?.stage_name || "Beatmaker";
  const facts = [
    beat.bpm ? { k: "BPM", v: String(beat.bpm) } : null,
    beat.musical_key ? { k: "Tonalité", v: beat.musical_key } : null,
    beat.genre ? { k: "Genre", v: beat.genre } : null,
    beat.mood ? { k: "Ambiance", v: beat.mood } : null,
    fmtDuration(beat.duration_seconds) ? { k: "Durée", v: fmtDuration(beat.duration_seconds)! } : null,
  ].filter((f): f is { k: string; v: string } => f !== null);
  const licenses = LICENSE_ORDER.filter((l) => beatPriceFor(beat, l) !== null);

  return (
    <div className="pt-6">
      <Link href="/prods" className="text-sm text-white/45 transition hover:text-white">
        ← Toutes les prods
      </Link>

      <section className="relative mt-5 overflow-hidden rounded-[32px] border border-white/10 p-5 sm:p-8">
        <CoverAtmosphere coverUrl={cover} intensity="panel" />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="relative aspect-square w-full max-w-[260px] shrink-0 overflow-hidden rounded-3xl bg-zinc-900 shadow-2xl ring-1 ring-white/15">
            <AppImage src={cover} alt={beat.title} fill sizes="260px" className="object-cover" priority />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-white/50">Instrumental</p>
            <h1 className="font-display mt-1 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[52px]">
              {beat.title}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[15px] text-white/70">
              Prod. {by}
              {beat.artists?.is_verified ? (
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} className="text-violet-300" />
              ) : null}
              <span className="text-white/35">· {beat.plays_count} écoutes</span>
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <BeatPlayHero beat={beat} />
              <a href="#licences" className="inline-flex h-12 items-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white transition hover:bg-white/[0.06]">
                Acheter une licence
              </a>
            </div>
          </div>
        </div>

        {facts.length ? (
          <dl className="relative z-10 mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-5">
            {facts.map((f) => (
              <div key={f.k} className="bg-black/60 px-4 py-3 backdrop-blur">
                <dt className="text-[11px] text-white/40">{f.k}</dt>
                <dd className="mt-0.5 text-[15px] font-semibold text-white">{f.v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </section>

      <section id="licences" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em]">Licences</h2>
        <p className="mt-1 text-sm text-white/45">
          La démo contient le tag du beatmaker. Les fichiers achetés sont livrés sans tag.
        </p>
        <div className={`mt-5 grid gap-3 ${licenses.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {licenses.map((l) => {
            const featured = l === "wav" && licenses.length > 1;
            return (
              <div
                key={l}
                className={`flex flex-col rounded-[28px] border p-5 ${
                  featured ? "violet-card border-violet-400/30" : "border-white/[0.08] bg-[#0a0a0a]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[15px] font-semibold text-white">{LICENSES[l].name}</p>
                  {featured ? (
                    <span className="rounded-full bg-violet-400/20 px-2.5 py-0.5 text-[11px] font-medium text-violet-200">
                      Le plus choisi
                    </span>
                  ) : null}
                </div>
                <p className="font-display mt-3 text-[30px] font-bold tracking-[-0.02em]">
                  {formatMoney(beatPriceFor(beat, l)!, country)}
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-white/65">
                  {LICENSES[l].perks.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <HugeiconsIcon icon={Tick02Icon} size={16} className="mt-0.5 shrink-0 text-violet-300" />
                      {p}
                    </li>
                  ))}
                </ul>
                <a
                  href={`/prods/b/${beat.public_id}/acheter?licence=${l}`}
                  className={`mt-6 inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition ${
                    featured ? "bg-white text-black hover:bg-white/90" : "bg-white/[0.08] text-white hover:bg-white/[0.14]"
                  }`}
                >
                  Acheter
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {beat.tags.length ? (
        <div className="mt-8 flex flex-wrap gap-2">
          {beat.tags.map((t) => (
            <Link key={t} href={`/prods?q=${encodeURIComponent(t)}`} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/60 hover:text-white">
              #{t}
            </Link>
          ))}
        </div>
      ) : null}

      {more.length ? (
        <section className="mt-14">
          <h2 className="font-display mb-4 text-2xl font-bold tracking-[-0.02em]">Plus de {by}</h2>
          <BeatList beats={more} country={country} />
        </section>
      ) : null}
    </div>
  );
}

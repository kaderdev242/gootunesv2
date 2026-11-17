import { VerifiedBadge } from "@/components/discover/VerifiedBadge";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { BeatDetailWave, BeatGrid, BeatPlayHero } from "@/components/prods/BeatList";
import { BeatmakerAvatar } from "@/components/prods/BeatmakerTiles";
import { Section } from "@/components/prods/Section";
import { formatMoney } from "@/lib/format";
import { beatPriceFor, LICENSE_ORDER, LICENSES, licenseCovered, tempoLabel } from "@/lib/prods/constants";
import { getBeatByPublicId, getOwnedBeatLicenses, getViewerCountry, listBeatsByArtist } from "@/lib/prods/queries";
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

export default async function BeatDetailPage({ params }: Props) {
  const { id } = await params;
  const beat = await getBeatByPublicId(id);
  if (!beat) notFound();

  const [country, more, owned] = await Promise.all([
    getViewerCountry(),
    beat.artists ? listBeatsByArtist(beat.artists.id, beat.id, 5) : Promise.resolve([]),
    getOwnedBeatLicenses(),
  ]);
  const mine = owned[beat.id];
  const a = beat.artists;
  const by = a?.stage_name || "Beatmaker";
  const licenses = LICENSE_ORDER.filter((l) => beatPriceFor(beat, l) !== null);
  const ownsAll = licenses.every((l) => licenseCovered(mine, l));
  const facts = [
    { k: "Tempo", v: beat.bpm ? `${beat.bpm} BPM` : null },
    { k: "Tonalité", v: beat.musical_key },
    { k: "Genre", v: beat.genre },
    { k: "Ambiance", v: beat.mood },
    { k: "Écoutes", v: String(beat.plays_count) },
  ].filter((f): f is { k: string; v: string } => Boolean(f.v));

  return (
    <div className="pt-8">
      <nav className="text-sm text-white/45" aria-label="Fil d'Ariane">
        <Link href="/prods" className="transition-colors hover:text-white">
          Prods
        </Link>
        {beat.genre ? (
          <>
            <span className="mx-2 text-white/25">/</span>
            <Link
              href={`/prods?genre=${encodeURIComponent(beat.genre)}`}
              className="transition-colors hover:text-white"
            >
              {beat.genre}
            </Link>
          </>
        ) : null}
      </nav>

      <section className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-12">
        <div className="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl bg-white/[0.04]">
          <AppImage
            src={beat.cover_url || FALLBACK_COVER}
            alt={beat.title}
            fill
            sizes="320px"
            className="object-cover"
            priority
          />
        </div>

        <div className="flex min-w-0 flex-col justify-end">
          <p className="font-mono text-[12px] text-white/45">{tempoLabel(beat) ?? "Instrumental"}</p>
          <h1 className="mt-2 font-display text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[52px]">
            {beat.title}
          </h1>
          {a ? (
            <Link
              href={`/prods/p/${a.public_id}`}
              className="mt-4 inline-flex items-center gap-2.5 self-start text-[15px] text-white/75 transition-colors hover:text-white"
            >
              <BeatmakerAvatar name={by} src={a.avatar_url} size={28} />
              Prod. {by}
              {a.is_verified ? <VerifiedBadge size={16} title="Beatmaker certifié" /> : null}
            </Link>
          ) : null}

          <div className="mt-8">
            <BeatDetailWave beat={beat} country={country} owned={owned} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <BeatPlayHero beat={beat} country={country} owned={owned} />
            {mine?.length ? (
              <a
                href="/prods/achats"
                className="inline-flex h-11 items-center whitespace-nowrap rounded-lg border border-white/[0.12] px-5 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
              >
                Télécharger mes fichiers
              </a>
            ) : null}
            {!ownsAll ? (
              <a
                href="#licences"
                className="inline-flex h-11 items-center whitespace-nowrap rounded-lg border border-white/[0.12] px-5 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
              >
                {mine?.length ? "Passer à une licence supérieure" : "Acheter une licence"}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <dl className="mt-10 grid grid-cols-2 border-y border-white/[0.06] sm:grid-cols-5">
        {facts.map((f) => (
          <div key={f.k} className="py-4 pr-4">
            <dt className="text-xs text-white/40">{f.k}</dt>
            <dd className="mt-1 text-[15px] font-medium tabular-nums text-white">{f.v}</dd>
          </div>
        ))}
      </dl>

      <section id="licences" className="mt-14 scroll-mt-24">
        <h2 className="font-display text-[24px] font-semibold tracking-[-0.02em]">Licences</h2>
        <p className="mt-1 text-sm text-white/45">
          La démo contient le tag du beatmaker. Les fichiers achetés sont livrés sans tag
        </p>
        <div
          className={`mt-6 grid gap-4 ${licenses.length === 3 ? "md:grid-cols-3" : licenses.length === 2 ? "md:grid-cols-2" : "max-w-sm"}`}
        >
          {licenses.map((l) => {
            const covered = licenseCovered(mine, l);
            const exact = mine?.includes(l);
            return (
              <div
                key={l}
                className={`flex flex-col rounded-xl border p-5 ${covered ? "border-white/[0.14] bg-white/[0.04]" : "border-white/[0.08] bg-[#121214]"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[15px] font-medium text-white">{LICENSES[l].name}</p>
                  {covered ? (
                    <span className="inline-flex items-center gap-1 text-xs text-white/60">
                      <HugeiconsIcon icon={Tick02Icon} size={14} />
                      {exact ? "Acquise" : "Incluse"}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 font-display text-[28px] font-semibold tabular-nums tracking-[-0.02em]">
                  {formatMoney(beatPriceFor(beat, l)!, country)}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-white/60">
                  {LICENSES[l].perks.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <HugeiconsIcon icon={Tick02Icon} size={16} className="mt-0.5 shrink-0 text-white/45" />
                      {p}
                    </li>
                  ))}
                </ul>
                {covered ? (
                  <a
                    href="/prods/achats"
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-lg border border-white/[0.14] text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
                  >
                    Télécharger
                  </a>
                ) : (
                  <a
                    href={`/prods/b/${beat.public_id}/acheter?licence=${l}`}
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-white text-sm font-medium text-black transition-colors hover:bg-white/90"
                  >
                    Acheter
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {beat.tags.length ? (
        <div className="mt-8 flex flex-wrap gap-2">
          {beat.tags.map((t) => (
            <Link
              key={t}
              href={`/prods?q=${encodeURIComponent(t)}`}
              className="rounded-md bg-white/[0.05] px-2.5 py-1 font-mono text-xs text-white/55 transition-colors hover:text-white"
            >
              #{t}
            </Link>
          ))}
        </div>
      ) : null}

      {more.length && a ? (
        <Section title={`Plus de ${by}`} href={`/prods/p/${a.public_id}`}>
          <BeatGrid beats={more} country={country} owned={owned} />
        </Section>
      ) : null}
    </div>
  );
}

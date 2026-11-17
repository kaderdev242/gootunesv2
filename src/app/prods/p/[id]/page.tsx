import { VerifiedBadge } from "@/components/discover/VerifiedBadge";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CoverAtmosphere } from "@/components/discover/CoverAtmosphere";
import { BeatRows } from "@/components/prods/BeatList";
import { BeatmakerAvatar } from "@/components/prods/BeatmakerTiles";
import { getCountryLabel } from "@/lib/constants";
import { getBeatmaker, getOwnedBeatLicenses, getViewerCountry, listBeatsByArtist } from "@/lib/prods/queries";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const bm = await getBeatmaker(id);
  if (!bm) return { title: "Beatmaker introuvable" };
  return {
    title: `${bm.stage_name} — prods et instrumentaux`,
    description: `Écoute et achète les prods de ${bm.stage_name} sur Gootunes Prods.`,
    openGraph: { images: bm.avatar_url ? [{ url: bm.avatar_url }] : undefined },
  };
}

export default async function BeatmakerPage({ params }: Props) {
  const { id } = await params;
  const bm = await getBeatmaker(id);
  if (!bm) notFound();

  const [beats, country, owned] = await Promise.all([listBeatsByArtist(bm.id), getViewerCountry(), getOwnedBeatLicenses()]);
  if (!beats.length) notFound();

  const plays = beats.reduce((s, b) => s + b.plays_count, 0);
  const genres = [...new Set(beats.map((b) => b.genre).filter(Boolean))].slice(0, 4);
  const stats = [
    { k: "Prods", v: beats.length },
    { k: "Écoutes", v: plays },
  ];

  // Couleurs du hero : la photo du beatmaker, sinon la pochette de sa dernière prod.
  const heroCover = bm.avatar_url || beats[0]?.cover_url || null;

  return (
    <div>
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden pb-16 pt-8">
        <CoverAtmosphere coverUrl={heroCover} intensity="panel" />
        <div className="pointer-events-none absolute inset-x-0 -bottom-px h-40 bg-gradient-to-b from-transparent via-[#0b0b0c]/70 to-[#0b0b0c]" aria-hidden />
        <div className="relative z-10 mx-auto max-w-[1400px] px-4 md:px-6">
          <Link href="/prods/beatmakers" className="text-sm text-white/60 transition-colors hover:text-white">
            Beatmakers
          </Link>

          <div className="mt-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
              <span className="rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                <BeatmakerAvatar name={bm.stage_name} src={bm.avatar_url} size={128} />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-white/65">
                  Beatmaker{bm.country ? ` · ${getCountryLabel(bm.country)}` : ""}
                </p>
                <h1 className="mt-1 flex flex-wrap items-center gap-x-2 font-display text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[48px]">
                  <span className="min-w-0 break-words">{bm.stage_name}</span>
                  {bm.is_verified ? <VerifiedBadge size={26} title="Beatmaker certifié" /> : null}
                </h1>
                {genres.length ? <p className="mt-2 text-sm text-white/55">{genres.join(" · ")}</p> : null}
              </div>
            </div>
            <dl className="flex gap-10">
              {stats.map((s) => (
                <div key={s.k}>
                  <dt className="text-xs text-white/55">{s.k}</dt>
                  <dd className="mt-1 font-display text-[28px] font-semibold tabular-nums tracking-[-0.02em]">
                    {s.v.toLocaleString("fr-FR")}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {bm.bio ? <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-white/60">{bm.bio}</p> : null}

      <section className="mt-10">
        <h2 className="mb-4 font-display text-[24px] font-semibold tracking-[-0.02em]">Toutes les prods</h2>
        <BeatRows beats={beats} country={country} owned={owned} />
      </section>
    </div>
  );
}

import { VerifiedBadge } from "@/components/discover/VerifiedBadge";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BeatRows } from "@/components/prods/BeatList";
import { BeatmakerAvatar } from "@/components/prods/BeatmakerTiles";
import { getCountryLabel } from "@/lib/constants";
import { getBeatmaker, getViewerCountry, listBeatsByArtist } from "@/lib/prods/queries";

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

  const [beats, country] = await Promise.all([listBeatsByArtist(bm.id), getViewerCountry()]);
  if (!beats.length) notFound();

  const plays = beats.reduce((s, b) => s + b.plays_count, 0);
  const genres = [...new Set(beats.map((b) => b.genre).filter(Boolean))].slice(0, 4);
  const stats = [
    { k: "Prods", v: beats.length },
    { k: "Écoutes", v: plays },
  ];

  return (
    <div className="pt-8">
      <Link href="/prods/beatmakers" className="text-sm text-white/45 transition-colors hover:text-white">
        Beatmakers
      </Link>

      <section className="mt-8 flex flex-col gap-8 border-b border-white/[0.06] pb-10 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-6">
          <BeatmakerAvatar name={bm.stage_name} src={bm.avatar_url} size={128} />
          <div className="min-w-0">
            <p className="text-sm text-white/45">
              Beatmaker{bm.country ? ` · ${getCountryLabel(bm.country)}` : ""}
            </p>
            <h1 className="mt-1 flex items-center gap-2 font-display text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[48px]">
              <span className="truncate">{bm.stage_name}</span>
              {bm.is_verified ? <VerifiedBadge size={26} title="Beatmaker certifié" /> : null}
            </h1>
            {genres.length ? <p className="mt-2 text-sm text-white/55">{genres.join(" · ")}</p> : null}
          </div>
        </div>
        <dl className="flex gap-10">
          {stats.map((s) => (
            <div key={s.k}>
              <dt className="text-xs text-white/40">{s.k}</dt>
              <dd className="mt-1 font-display text-[28px] font-semibold tabular-nums tracking-[-0.02em]">
                {s.v.toLocaleString("fr-FR")}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {bm.bio ? <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-white/60">{bm.bio}</p> : null}

      <section className="mt-10">
        <h2 className="mb-4 font-display text-[24px] font-semibold tracking-[-0.02em]">Toutes les prods</h2>
        <BeatRows beats={beats} country={country} />
      </section>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { MUSIC_GENRES } from "@/lib/genres";
import { getViewerCountry } from "@/lib/auth/viewer-country";
import {
  getCatalogReleases,
  getGenreCounts,
} from "@/lib/discover/queries";
import { ReleaseCardGrid } from "@/components/discover/ReleaseCardGrid";
import { listPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = listPageMetadata({
  title: "Genres",
  description:
    "Explore la musique africaine par genre — Rumba, Afrobeats, Drill et plus — sur Gootunes.",
  path: "/discover/genres",
});

type Props = { searchParams: Promise<{ genre?: string }> };

export default async function GenresPage({ searchParams }: Props) {
  const { genre: selected } = await searchParams;
  const [counts, catalog, country] = await Promise.all([
    getGenreCounts(),
    getCatalogReleases({
      genre: selected || null,
      limit: selected ? 48 : 24,
    }),
    getViewerCountry(),
  ]);
  const releases = catalog.items;

  const countMap = new Map(counts.map((c) => [c.genre, c.count]));
  const activeGenres = MUSIC_GENRES.filter(
    (g) => (countMap.get(g) || 0) > 0 || !selected,
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-8">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-tight text-white">
          Genres
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Explore les sons africains — de la Rumba à l&apos;Afro-Drill.
        </p>
      </header>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/discover/genres"
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              !selected
                ? "border-white/30 bg-white text-black"
                : "border-white/12 bg-white/[0.04] text-white/80 hover:border-white/25 hover:bg-white/10"
            }`}
          >
            Tous
          </Link>
          {activeGenres.map((genre) => {
            const count = countMap.get(genre) || 0;
            const active = selected === genre;
            return (
              <Link
                key={genre}
                href={`/discover/genres?genre=${encodeURIComponent(genre)}`}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "border-white/30 bg-white text-black"
                    : "border-white/12 bg-white/[0.04] text-white/80 hover:border-white/25 hover:bg-white/10"
                }`}
              >
                {genre}
                {count ? (
                  <span className="ml-1.5 opacity-60">{count}</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      <section>
        <h2 className="font-display mb-4 text-2xl font-bold text-white">
          {selected ? selected : "Sorties du catalogue"}
        </h2>
        <ReleaseCardGrid
          items={releases}
          country={country}
          emptyLabel={
            selected
              ? `Aucune sortie en ${selected} pour le moment.`
              : "Aucune sortie publiée."
          }
        />
      </section>
    </div>
  );
}

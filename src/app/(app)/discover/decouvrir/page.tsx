import { Suspense } from "react";
import type { Metadata } from "next";
import { DiscoverSearch } from "@/components/discover/DiscoverSearch";
import { ReleaseCardGrid } from "@/components/discover/ReleaseCardGrid";
import { getViewerCountry } from "@/lib/auth/viewer-country";
import {
  getCatalogReleases,
  getRisingArtists,
  getTrendingTracks,
} from "@/lib/discover/queries";
import { HorizontalSection } from "@/components/feed/HorizontalSection";
import { TrackList } from "@/components/feed/TrackList";
import { listPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = listPageMetadata({
  title: "Découvrir",
  description:
    "Recherche titres, artistes et genres sur Gootunes. Trouve ta prochaine écoute et achète en un clic.",
  path: "/discover/decouvrir",
});

type Props = { searchParams: Promise<{ q?: string }> };

export default async function DecouvrirPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const [catalog, trending, artists, country] = await Promise.all([
    getCatalogReleases({ query, limit: 48 }),
    query ? Promise.resolve([]) : getTrendingTracks(8),
    query ? Promise.resolve([]) : getRisingArtists(8),
    getViewerCountry(),
  ]);
  const results = catalog.items;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-8">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">
            Découvrir
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Explore le catalogue par titre, artiste ou genre.
          </p>
        </div>
        <Suspense fallback={<div className="h-12 rounded-full bg-white/5" />}>
          <DiscoverSearch />
        </Suspense>
      </header>

      {query ? (
        <section>
          <h2 className="font-display mb-4 text-2xl font-bold text-white">
            Résultats pour « {query} »
          </h2>
          <ReleaseCardGrid
            items={results}
            country={country}
            emptyLabel="Aucun résultat pour cette recherche."
          />
        </section>
      ) : (
        <>
          <TrackList
            tracks={trending}
            title="Tendances du moment"
            emptyLabel="Pas encore de tendances."
          />
          <HorizontalSection
            title="Artistes à explorer"
            kind="artists"
            items={artists}
            emptyLabel="Aucun artiste pour le moment."
          />
          <section>
            <h2 className="font-display mb-4 text-2xl font-bold text-white">
              Tout le catalogue
            </h2>
            <ReleaseCardGrid items={results} country={country} />
          </section>
        </>
      )}
    </div>
  );
}

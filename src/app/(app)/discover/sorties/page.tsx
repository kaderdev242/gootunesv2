import Link from "next/link";
import type { Metadata } from "next";
import { DiscoverFooter } from "@/components/discover/DiscoverFooter";
import { TrackList } from "@/components/feed/TrackList";
import { getRecentTracks } from "@/lib/discover/queries";
import { listPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = listPageMetadata({
  title: "Sorties",
  description:
    "Les dernières sorties musicales publiées sur Gootunes. Sois le premier à écouter et acheter.",
  path: "/discover/sorties",
});

export default async function SortiesPage() {
  const tracks = await getRecentTracks(48);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-4">
      <header>
        <Link
          href="/"
          className="text-sm text-white/45 transition hover:text-white"
        >
          ← Discover
        </Link>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-white">
          Sorties récentes
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Les dernières publications sur Gootunes.
        </p>
      </header>

      <TrackList
        tracks={tracks}
        title="Toutes les sorties"
        emptyLabel="Aucune sortie récente pour le moment."
      />

      <DiscoverFooter />
    </div>
  );
}

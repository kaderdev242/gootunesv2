import Link from "next/link";
import { DiscoverFooter } from "@/components/discover/DiscoverFooter";
import { TrackList } from "@/components/feed/TrackList";
import { getRecentTracks } from "@/lib/discover/queries";

export const dynamic = "force-dynamic";

export default async function SortiesPage() {
  const tracks = await getRecentTracks(48);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-4">
      <header>
        <Link
          href="/discover"
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

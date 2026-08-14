import Link from "next/link";
import { DiscoverFooter } from "@/components/discover/DiscoverFooter";
import { TrackList } from "@/components/feed/TrackList";
import { getTrendingTracks } from "@/lib/discover/queries";

export const dynamic = "force-dynamic";

export default async function TendancesPage() {
  const tracks = await getTrendingTracks(48);

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
          Tendances
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Les titres qui montent en ce moment.
        </p>
      </header>

      <TrackList
        tracks={tracks}
        title="Tendances du moment"
        emptyLabel="Pas encore de tendances."
      />

      <DiscoverFooter />
    </div>
  );
}

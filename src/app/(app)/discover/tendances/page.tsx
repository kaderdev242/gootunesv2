import Link from "next/link";
import type { Metadata } from "next";
import { DiscoverFooter } from "@/components/discover/DiscoverFooter";
import { TrackList } from "@/components/feed/TrackList";
import { getTrendingTracks } from "@/lib/discover/queries";
import { listPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = listPageMetadata({
  title: "Tendances",
  description:
    "Les titres en tendance sur Gootunes. Découvre ce que les fans écoutent et achètent en ce moment.",
  path: "/discover/tendances",
});

export default async function TendancesPage() {
  const tracks = await getTrendingTracks(48);

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

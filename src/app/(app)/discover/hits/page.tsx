import Link from "next/link";
import type { Metadata } from "next";
import { DiscoverFooter } from "@/components/discover/DiscoverFooter";
import { TrackList } from "@/components/feed/TrackList";
import { getEditorialHits } from "@/lib/discover/queries";
import { listPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = listPageMetadata({
  title: "Hits",
  description:
    "Les hits sélectionnés par l’équipe Gootunes. Écoute et achète les titres qui cartonnent en Afrique.",
  path: "/discover/hits",
});

export default async function HitsPage() {
  const tracks = await getEditorialHits(48);

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
          Les Hits
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Sélection éditoriale Gootunes.
        </p>
      </header>

      <TrackList
        tracks={tracks}
        title="Tous les hits"
        emptyLabel="Aucun hit publié pour le moment."
      />

      <DiscoverFooter />
    </div>
  );
}

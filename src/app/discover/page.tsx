import { DiscoverFooter } from "@/components/discover/DiscoverFooter";
import { CatalogSection } from "@/components/discover/CatalogSection";
import { TrackList } from "@/components/feed/TrackList";
import { HorizontalSection } from "@/components/feed/HorizontalSection";
import { DiscoverCards } from "@/components/feed/DiscoverCards";
import { createClient } from "@/lib/supabase/server";
import {
  getEditorialHits,
  getFeaturedAlbums,
  getRecentTracks,
  getRecommendedTracks,
  getRisingArtists,
  getTrendingTracks,
  getWeeklyTop,
} from "@/lib/discover/queries";

export const dynamic = "force-dynamic";

export default async function FeedHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [recent, trending, albums, recommended, weeklyTop, artists, hits] =
    await Promise.all([
      getRecentTracks(12),
      getTrendingTracks(12),
      getFeaturedAlbums(12),
      getRecommendedTracks(user?.id, 8),
      getWeeklyTop(5),
      getRisingArtists(12),
      getEditorialHits(20),
    ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Discover
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Sorties, tendances et catalogue pour les fans
        </p>
      </header>

      <DiscoverCards />

      <CatalogSection />

      <HorizontalSection
        title="Sorties récentes"
        kind="tracks"
        items={recent}
        seeAllHref="/discover/sorties"
        emptyLabel="Aucune sortie récente pour le moment."
      />

      <HorizontalSection
        title="Tendances"
        kind="tracks"
        items={trending}
        seeAllHref="/discover/tendances"
        emptyLabel="Pas encore de tendances — publie ou écoute des titres."
      />

      {hits.length > 0 ? (
        <HorizontalSection
          title="Les Hits"
          kind="tracks"
          items={hits}
          cardSize="lg"
          seeAllHref="/discover/hits"
          emptyLabel="Aucun hit publié pour le moment."
        />
      ) : null}

      <TrackList
        tracks={weeklyTop}
        title="Top 5 de la semaine"
        emptyLabel="Le top de la semaine se remplit avec les ventes et écoutes."
      />

      <HorizontalSection
        title="Artistes en vogue"
        kind="artists"
        items={artists}
        seeAllHref="/discover/artistes"
        emptyLabel="Aucun artiste en vogue pour le moment."
      />

      <HorizontalSection
        title="Albums à la une"
        kind="albums"
        items={albums}
        seeAllHref="/discover/albums"
        emptyLabel="Aucun album publié pour le moment."
      />

      <TrackList
        tracks={recommended}
        title="Recommandés pour vous"
        emptyLabel="Connecte-toi et choisis des genres pour des recommandations."
      />

      <DiscoverFooter />
    </div>
  );
}

import { DiscoverFooter } from "@/components/discover/DiscoverFooter";
import { CatalogSection } from "@/components/discover/CatalogSection";
import { PublicPlaylistsSection } from "@/components/discover/PublicPlaylistsSection";
import { HorizontalSection } from "@/components/feed/HorizontalSection";
import { TrackSpotlightGrid } from "@/components/feed/TrackSpotlightGrid";
import {
  getEditorialHits,
  getFeaturedAlbums,
  getRecentTracks,
  getRisingArtists,
  getTrendingTracks,
  getWeeklyTop,
} from "@/lib/discover/queries";

export async function HomeFeed() {
  const [recent, trending, albums, weeklyTop, artists, hits] =
    await Promise.all([
      getRecentTracks(12),
      getTrendingTracks(12),
      getFeaturedAlbums(12),
      getWeeklyTop(9),
      getRisingArtists(12),
      getEditorialHits(20),
    ]);

  const hitTracks = hits.length > 0 ? hits : trending;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-10 pb-4">
      <HorizontalSection
        title="Tendances"
        kind="tracks"
        items={trending}
        cardSize="md"
        seeAllHref="/discover/tendances"
        emptyLabel="Pas encore de tendances."
      />

      <TrackSpotlightGrid
        title="Nouveaux titres"
        tracks={recent}
        seeAllHref="/discover/sorties"
        emptyLabel="Aucune sortie récente pour le moment."
      />

      <HorizontalSection
        title="Albums populaires"
        kind="albums"
        items={albums}
        cardSize="md"
        seeAllHref="/discover/albums"
        emptyLabel="Aucun album publié pour le moment."
      />

      {hitTracks.length > 0 ? (
        <HorizontalSection
          title="Les hits"
          kind="tracks"
          items={hitTracks}
          cardSize="lg"
          seeAllHref="/discover/hits"
          emptyLabel="Aucun hit pour le moment."
        />
      ) : null}

      <TrackSpotlightGrid
        title="Spotlight"
        subtitle="Sélection du moment — ventes et écoutes de la semaine."
        tracks={weeklyTop}
        seeAllHref="/discover/tendances"
        emptyLabel="Le spotlight se remplit avec les ventes et écoutes."
      />

      <HorizontalSection
        title="Artistes populaires"
        kind="artists"
        items={artists}
        cardSize="lg"
        seeAllHref="/discover/artistes"
        emptyLabel="Aucun artiste en vogue pour le moment."
      />

      <CatalogSection />

      <PublicPlaylistsSection />

      <DiscoverFooter />
    </div>
  );
}

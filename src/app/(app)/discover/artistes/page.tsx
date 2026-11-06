import { AppImage } from "@/components/media/AppImage";
import Link from "next/link";
import type { Metadata } from "next";
import { DiscoverFooter } from "@/components/discover/DiscoverFooter";
import { getRisingArtists } from "@/lib/discover/queries";
import { listPageMetadata } from "@/lib/seo";
import { VerifiedBadge } from "@/components/discover/VerifiedBadge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = listPageMetadata({
  title: "Artistes",
  description:
    "Explore les artistes émergents et confirmés sur Gootunes. Soutiens-les en achetant leur musique en Direct-to-Fan.",
  path: "/discover/artistes",
});

export default async function ArtistesPage() {
  const artists = await getRisingArtists(48);

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
          Artistes en vogue
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Artistes à découvrir sur Gootunes.
        </p>
      </header>

      {artists.length === 0 ? (
        <p className="text-sm text-white/40">
          Aucun artiste en vogue pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {artists.map((artist) => (
            <Link
              key={artist.id}
              href={`/discover/artiste/${artist.id}`}
              className="group text-center transition hover:-translate-y-0.5"
            >
              <div className="relative mx-auto aspect-square w-full max-w-[160px] overflow-hidden rounded-full ring-1 ring-white/10">
                <AppImage
                  src={artist.avatar}
                  alt={artist.name}
                  fill
                  className="object-cover transition-[filter] duration-200 group-hover:brightness-110"
                  sizes="160px"
                />
              </div>
              <p className="mt-3 flex items-center justify-center gap-1 truncate text-sm font-semibold text-white">
                <span className="truncate">{artist.name}</span>
                {artist.verified ? (
                  <VerifiedBadge size={13} className="shrink-0" />
                ) : null}
              </p>
              {artist.genre ? (
                <p className="truncate text-xs text-white/40">{artist.genre}</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}

      <DiscoverFooter />
    </div>
  );
}

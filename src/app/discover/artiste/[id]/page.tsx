import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getArtistById,
  releaseToAlbum,
  releaseToTrack,
} from "@/lib/discover/queries";
import { HorizontalSection } from "@/components/feed/HorizontalSection";
import { TrackList } from "@/components/feed/TrackList";
import { ShareButton } from "@/components/discover/ShareButton";
import { ArtistHeroPlayButton } from "@/components/discover/ArtistHeroPlayButton";
import { getCountryLabel } from "@/lib/constants";
import { isCountryCode } from "@/lib/geo";
import { CountryFlag } from "@/components/auth/CountryFlag";
import { artistPath, isUuid } from "@/lib/public-id";
import { absoluteMediaUrl, siteUrl } from "@/lib/seo";
import { FALLBACK_COVER } from "@/lib/types/music";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getArtistById(id);
  if (!data) {
    return { title: "Artiste introuvable" };
  }

  const { artist, releases } = data;
  const title = artist.stage_name;
  const description =
    artist.bio?.trim() ||
    `Découvre ${artist.stage_name} sur Gootunes — ${releases.length} publication${releases.length > 1 ? "s" : ""}. Achète la musique directement auprès de l’artiste.`;
  const image = absoluteMediaUrl(artist.avatar_url || FALLBACK_COVER);
  const url = siteUrl(artistPath(artist.public_id));

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — Artiste`,
      description,
      url,
      type: "profile",
      siteName: "Gootunes",
      images: [
        {
          url: image,
          width: 1200,
          height: 1200,
          alt: artist.stage_name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Artiste`,
      description,
      images: [image],
    },
  };
}

export default async function ArtistDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getArtistById(id);
  if (!data) notFound();

  const { artist, releases, listenCount } = data;

  if (isUuid(id) && artist.public_id) {
    permanentRedirect(artistPath(artist.public_id));
  }
  const singles = releases
    .filter((r) => r.type === "single")
    .map((r) => releaseToTrack(r));
  const albums = releases
    .filter((r) => r.type === "album")
    .map((r) => releaseToAlbum(r));
  const allTracks = releases.flatMap((r) => {
    const tracks = [...(r.tracks || [])].sort(
      (a, b) => a.track_number - b.track_number,
    );
    if (!tracks.length) return [releaseToTrack(r)];
    return tracks.map((t) => releaseToTrack(r, t));
  });
  const avatar = artist.avatar_url || FALLBACK_COVER;

  return (
    <div className="-mx-4 -mt-6 flex flex-col pb-12 sm:-mx-6 lg:-mx-8">
      {/* Hero type Spotify */}
      <section className="relative min-h-[340px] overflow-hidden sm:min-h-[380px]">
        <div className="absolute inset-0">
          <Image
            src={avatar}
            alt=""
            fill
            className="object-cover opacity-55 blur-2xl scale-110"
            sizes="1200px"
            aria-hidden
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-[#121212]" />
          <div className="violet-card absolute inset-0 opacity-35 mix-blend-soft-light" />
        </div>

        <div className="relative mx-auto flex h-full min-h-[340px] max-w-5xl flex-col justify-end px-4 pt-16 pb-8 sm:min-h-[380px] sm:px-6 sm:pb-10 lg:px-8">
          <Link
            href="/discover"
            className="absolute top-4 left-4 text-sm text-white/55 transition hover:text-white sm:left-6 lg:left-8"
          >
            ← Discover
          </Link>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <div className="relative mx-auto size-40 shrink-0 overflow-hidden rounded-full shadow-[0_24px_80px_rgba(0,0,0,0.65)] ring-1 ring-white/20 sm:mx-0 sm:size-52 md:size-56">
              <Image
                src={avatar}
                alt={artist.stage_name}
                fill
                className="object-cover"
                sizes="224px"
                priority
              />
            </div>

            <div className="min-w-0 flex-1 text-center sm:pb-1 sm:text-left">
              <p className="text-sm font-medium text-white/80">Artiste</p>
              <h1 className="font-display mt-1 text-4xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
                {artist.stage_name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-white/65 sm:justify-start">
                <span>
                  {listenCount.toLocaleString("fr-FR")} écoute
                  {listenCount > 1 ? "s" : ""}
                </span>
                <span>·</span>
                <span>
                  {releases.length} publication{releases.length > 1 ? "s" : ""}
                </span>
                {artist.country ? (
                  <>
                    <span>·</span>
                    {isCountryCode(artist.country) ? (
                      <span className="inline-flex items-center gap-1.5">
                        <CountryFlag
                          code={artist.country}
                          title={getCountryLabel(artist.country)}
                        />
                        {getCountryLabel(artist.country)}
                      </span>
                    ) : (
                      <span>{getCountryLabel(artist.country)}</span>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Barre d'actions */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#121212]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <ArtistHeroPlayButton tracks={allTracks} />
          <ShareButton
            title={artist.stage_name}
            path={`/discover/artiste/${artist.public_id}`}
          />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pt-8 sm:px-6 lg:px-8">
        {artist.bio ? (
          <section>
            <h2 className="text-lg font-bold text-white">À propos</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">
              {artist.bio}
            </p>
          </section>
        ) : null}

        {allTracks.length > 0 ? (
          <TrackList
            tracks={allTracks.slice(0, 10)}
            title="Populaires"
            emptyLabel="Aucun titre pour le moment."
          />
        ) : null}

        {albums.length > 0 ? (
          <HorizontalSection title="Discographie" kind="albums" items={albums} />
        ) : null}

        {singles.length > 0 && albums.length > 0 ? (
          <TrackList
            tracks={singles}
            title="Singles"
            emptyLabel="Aucun single."
          />
        ) : null}

        {!allTracks.length && !albums.length ? (
          <p className="text-sm text-white/40">
            Cet artiste n&apos;a pas encore de publication.
          </p>
        ) : null}
      </div>
    </div>
  );
}

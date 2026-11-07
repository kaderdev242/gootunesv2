import { AppImage } from "@/components/media/AppImage";
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
import { CollectionPlayControls, ShuffleAction } from "@/components/discover/CollectionPlayControls";
import { formatCount } from "@/lib/format";
import { getCountryLabel } from "@/lib/constants";
import { isCountryCode } from "@/lib/geo";
import { CountryFlag } from "@/components/auth/CountryFlag";
import { artistPath, isUuid } from "@/lib/public-id";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteMediaUrl, siteUrl } from "@/lib/seo";
import { FALLBACK_COVER } from "@/lib/types/music";
import { VerifiedBadge } from "@/components/discover/VerifiedBadge";

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
  const pageUrl = siteUrl(artistPath(artist.public_id));

  return (
    <div className="-mx-5 -mt-5 flex flex-col pb-12 sm:-mx-8 sm:-mt-6 lg:-mx-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MusicGroup",
          name: artist.stage_name,
          url: pageUrl,
          image: absoluteMediaUrl(avatar),
          description: artist.bio || undefined,
          genre: undefined,
          album: albums.slice(0, 20).map((a) => ({
            "@type": "MusicAlbum",
            name: a.title,
            url: siteUrl(`/discover/release/${a.id}`),
          })),
        }}
      />
      {/* Photo plein cadre, nom posé en bas à gauche */}
      <section className="relative h-[380px] overflow-hidden sm:h-[440px] lg:h-[480px]">
        <AppImage
          src={avatar}
          alt=""
          fill
          className="object-cover object-[center_30%]"
          sizes="100vw"
          aria-hidden
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/35 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

        <div className="absolute inset-x-0 bottom-0 px-5 pb-8 sm:px-8 lg:px-10">
          <p className="text-[13px] font-medium text-white/70">Artiste</p>
          <h1 className="font-display mt-2 flex flex-wrap items-center gap-3 text-[44px] font-semibold leading-none text-white sm:text-[64px] lg:text-[80px]">
            <span className="min-w-0 break-words">{artist.stage_name}</span>
            {artist.is_verified ? <VerifiedBadge size={28} className="sm:size-9" /> : null}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-white/65">
            <span className="tabular-nums">
              {formatCount(listenCount)} écoute{listenCount > 1 ? "s" : ""}
            </span>
            <span aria-hidden>·</span>
            <span>
              {releases.length} sortie{releases.length > 1 ? "s" : ""}
            </span>
            {artist.country ? (
              <>
                <span aria-hidden>·</span>
                {isCountryCode(artist.country) ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CountryFlag code={artist.country} title={getCountryLabel(artist.country)} />
                    {getCountryLabel(artist.country)}
                  </span>
                ) : (
                  <span>{getCountryLabel(artist.country)}</span>
                )}
              </>
            ) : null}
          </div>
        </div>
      </section>

      {/* Actions : lecture à gauche, icônes à droite */}
      <div className="flex items-start justify-between gap-4 bg-[#0a0a0a] px-5 pt-2 sm:px-8 lg:px-10">
        <div className="pt-1">
          <CollectionPlayControls tracks={allTracks} />
        </div>
        <div className="flex items-start gap-1 sm:gap-2">
          <ShuffleAction tracks={allTracks} />
          <ShareButton
            title={artist.stage_name}
            path={`/discover/artiste/${artist.public_id}`}
            cover={avatar}
          />
        </div>
      </div>

      <div className="flex w-full flex-col gap-10 px-5 pt-8 sm:px-8 lg:px-10">
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

        {artist.bio ? (
          <section>
            <h2 className="text-[20px] font-semibold text-white">À propos</h2>
            <p className="mt-3 max-w-3xl whitespace-pre-line text-[15px] leading-relaxed text-white/60">
              {artist.bio}
            </p>
          </section>
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

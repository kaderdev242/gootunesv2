import { AppImage } from "@/components/media/AppImage";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getArtistById,
  getReleaseById,
  releaseToAlbum,
  releaseToTrack,
} from "@/lib/discover/queries";
import { DetailHero } from "@/components/discover/DetailHero";
import { ReleaseTrackTable } from "@/components/discover/ReleaseTrackTable";
import { ReleaseBuyButton, ReleaseDetailActions } from "@/components/discover/ReleaseDetailActions";
import { PurchaseUnlock } from "@/components/discover/PurchaseUnlock";
import { ReleaseCredits } from "@/components/discover/ReleaseCredits";
import { ExplicitBadge } from "@/components/discover/ExplicitBadge";
import { VerifiedBadge } from "@/components/discover/VerifiedBadge";
import { userOwnsRelease } from "@/lib/audio/access";
import { getUserPlaylists } from "@/lib/playlists/queries";
import { formatTotalDuration, formatMoney } from "@/lib/format";
import { isUuid, releasePath } from "@/lib/public-id";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteMediaUrl, siteUrl } from "@/lib/seo";
import { FALLBACK_COVER } from "@/lib/types/music";
import { getViewerCountry } from "@/lib/auth/viewer-country";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const release = await getReleaseById(id);
  if (!release) {
    return { title: "Publication introuvable" };
  }

  const artistName = release.artists?.stage_name || "Artiste";
  const kind = release.type === "album" ? "Album" : "Single";
  const title = `${release.title} — ${artistName}`;
  const description = release.genre
    ? `${kind} ${release.genre} par ${artistName} sur Gootunes. Achète et écoute directement via Mobile Money.`
    : `${kind} par ${artistName} sur Gootunes. Achète et écoute directement via Mobile Money.`;
  const image = absoluteMediaUrl(release.cover_url || FALLBACK_COVER);
  const url = siteUrl(releasePath(release.public_id));

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: release.type === "album" ? "music.album" : "music.song",
      siteName: "Gootunes",
      images: [
        {
          url: image,
          width: 1200,
          height: 1200,
          alt: `${release.title} — ${artistName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ReleaseDetailPage({ params }: Props) {
  const { id } = await params;
  const release = await getReleaseById(id);
  if (!release) notFound();

  if (isUuid(id) && release.public_id) {
    permanentRedirect(releasePath(release.public_id));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const owned = user
    ? user.id === release.owner_id ||
      (await userOwnsRelease(user.id, release.id))
    : false;

  const playlists = user ? await getUserPlaylists(user.id, 40) : [];

  const artist = release.artists;
  const tracks = [...(release.tracks || [])].sort(
    (a, b) => a.track_number - b.track_number,
  );
  const cover = release.cover_url || FALLBACK_COVER;
  const viewerCountry = await getViewerCountry();
  const priceLabel = formatMoney(Number(release.price_fcfa), viewerCountry);
  const uiTracks = tracks.map((t) => ({
    ...releaseToTrack(release, t),
    owned,
  }));

  const totalSeconds = tracks.reduce(
    (sum, t) => sum + (t.duration_seconds && t.duration_seconds > 0 ? t.duration_seconds : 0),
    0,
  );
  const durationLabel =
    totalSeconds > 0 ? formatTotalDuration(totalSeconds) : null;
  const year = release.created_at
    ? new Date(release.created_at).getFullYear()
    : null;
  const metaParts = [
    `${tracks.length} titre${tracks.length > 1 ? "s" : ""}`,
    durationLabel,
    year ? String(year) : null,
    release.genre,
  ].filter(Boolean);

  const moreByArtist =
    artist?.id
      ? ((await getArtistById(artist.id))?.releases || [])
          .filter((r) => r.id !== release.id)
          .slice(0, 10)
          .map(releaseToAlbum)
      : [];

  const artistName = artist?.stage_name || "Artiste";
  const pageUrl = siteUrl(releasePath(release.public_id));
  const musicJsonLd =
    release.type === "album"
      ? {
          "@context": "https://schema.org",
          "@type": "MusicAlbum",
          name: release.title,
          url: pageUrl,
          image: absoluteMediaUrl(cover),
          genre: release.genre || undefined,
          datePublished: release.created_at,
          byArtist: {
            "@type": "MusicGroup",
            name: artistName,
            url: artist?.public_id
              ? siteUrl(`/discover/artiste/${artist.public_id}`)
              : undefined,
          },
          numTracks: tracks.length,
          offers: {
            "@type": "Offer",
            price: Number(release.price_fcfa),
            priceCurrency: "XAF",
            availability: "https://schema.org/InStock",
            url: pageUrl,
          },
        }
      : {
          "@context": "https://schema.org",
          "@type": "MusicRecording",
          name: release.title,
          url: pageUrl,
          image: absoluteMediaUrl(cover),
          genre: release.genre || undefined,
          datePublished: release.created_at,
          byArtist: {
            "@type": "MusicGroup",
            name: artistName,
            url: artist?.public_id
              ? siteUrl(`/discover/artiste/${artist.public_id}`)
              : undefined,
          },
          offers: {
            "@type": "Offer",
            price: Number(release.price_fcfa),
            priceCurrency: "XAF",
            availability: "https://schema.org/InStock",
            url: pageUrl,
          },
        };

  return (
    <div className="pb-16">
      <JsonLd data={musicJsonLd} />
      {owned ? <PurchaseUnlock releaseId={release.id} /> : null}

      <DetailHero
        kicker={`${release.type === "album" ? "Album" : "Single"}${owned ? " · Acheté" : ""}`}
        title={release.title}
        cover={cover}
        tracks={uiTracks}
        showShuffle={release.type === "album"}
        meta={metaParts.join(" · ")}
        identity={
          artist ? (
            <Link
              href={`/discover/artiste/${artist.public_id || artist.id}`}
              className="inline-flex items-center gap-2.5 text-sm font-medium text-white transition hover:text-white/80"
            >
              <span className="relative size-7 overflow-hidden rounded-full ring-1 ring-white/25">
                <AppImage
                  src={artist.avatar_url || FALLBACK_COVER}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              </span>
              {tracks.some((t) => t.is_explicit) ? <ExplicitBadge /> : null}
              {artist.stage_name}
              {artist.is_verified ? (
                <VerifiedBadge size={15} className="shrink-0" />
              ) : null}
            </Link>
          ) : null
        }
        primary={
          <ReleaseBuyButton releaseId={release.public_id} priceLabel={priceLabel} owned={owned} />
        }
        actions={
          <ReleaseDetailActions
            releaseId={release.public_id}
            title={release.title}
            cover={cover}
            hasCredits={Boolean(
              release.featuring?.trim() ||
                Object.values((release.credits ?? {}) as Record<string, string | null>).some((v) => v?.trim()),
            )}
          />
        }
      />

      <section className="mt-2 px-0 sm:mt-4">
        <ReleaseTrackTable
          tracks={uiTracks}
          playlists={playlists}
          isLoggedIn={!!user}
        />
      </section>

      <ReleaseCredits
        credits={release.credits}
        featuring={release.featuring}
      />

      {moreByArtist.length > 0 && artist ? (
        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-3">
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Plus d&apos;albums par {artistName}
            </h2>
            <Link
              href={`/discover/artiste/${artist.public_id || artist.id}`}
              className="shrink-0 text-sm text-white/45 transition hover:text-white"
            >
              Tout voir
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {moreByArtist.map((album) => (
              <Link
                key={album.id}
                href={`/discover/release/${album.id}`}
                className="w-[148px] shrink-0 transition hover:-translate-y-0.5 sm:w-[160px]"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg ring-1 ring-white/10">
                  <AppImage
                    src={album.cover}
                    alt={album.title}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                </div>
                <p className="mt-3 truncate text-sm font-semibold text-white">
                  {album.title}
                </p>
                <p className="truncate text-xs text-white/40">
                  {album.artist}
                  {album.year ? ` · ${album.year}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

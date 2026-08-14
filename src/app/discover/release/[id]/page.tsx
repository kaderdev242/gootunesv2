import Image from "next/image";
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
import { ReleaseDetailHero } from "@/components/discover/ReleaseDetailHero";
import { ReleaseTrackPlayButton } from "@/components/discover/ReleaseTrackPlayButton";
import { TrackDuration } from "@/components/discover/TrackDuration";
import { PurchaseUnlock } from "@/components/discover/PurchaseUnlock";
import { ReleaseCredits } from "@/components/discover/ReleaseCredits";
import { AddToPlaylistButton } from "@/components/discover/AddToPlaylistButton";
import { userOwnsRelease } from "@/lib/audio/access";
import { getUserPlaylists } from "@/lib/playlists/queries";
import { formatDuration, formatMoney } from "@/lib/format";
import { isUuid, releasePath } from "@/lib/public-id";
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
    totalSeconds > 0 ? formatDuration(totalSeconds) : null;
  const year = release.created_at
    ? new Date(release.created_at).getFullYear()
    : null;

  const moreByArtist =
    artist?.id
      ? ((await getArtistById(artist.id))?.releases || [])
          .filter((r) => r.id !== release.id)
          .slice(0, 10)
          .map(releaseToAlbum)
      : [];

  const artistName = artist?.stage_name || "Artiste";

  return (
    <div className="mx-auto max-w-5xl pb-16">
      {owned ? <PurchaseUnlock releaseId={release.id} /> : null}

      <Link
        href="/discover"
        className="mb-4 inline-flex text-sm text-white/45 transition hover:text-white"
      >
        ← Retour Discover
      </Link>

      <ReleaseDetailHero
        releaseId={release.public_id}
        title={release.title}
        type={release.type}
        genre={release.genre}
        cover={cover}
        priceLabel={priceLabel}
        owned={owned}
        trackCount={tracks.length}
        durationLabel={durationLabel}
        year={year}
        artist={artist}
      />

      <section className="mt-2 px-0 sm:mt-4">
        <div className="hidden grid-cols-[2.5rem_2.5rem_minmax(0,1.4fr)_minmax(0,1fr)_4.5rem_auto] items-center gap-3 border-b border-white/10 px-2 pb-3 text-[11px] font-semibold tracking-[0.14em] text-white/35 uppercase sm:grid">
          <span>#</span>
          <span />
          <span>Titre</span>
          <span>Artiste</span>
          <span className="text-right">Dur.</span>
          <span className="w-[5.5rem]" />
        </div>

        <div className="mt-1 flex flex-col">
          {tracks.map((t, index) => {
            const uiTrack = uiTracks[index];
            const trackCover = uiTrack.cover || cover || FALLBACK_COVER;
            return (
              <div
                key={t.id}
                className="grid grid-cols-[2rem_2.5rem_minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-2 py-2.5 transition hover:bg-white/[0.04] sm:grid-cols-[2.5rem_2.5rem_minmax(0,1.4fr)_minmax(0,1fr)_4.5rem_auto] sm:gap-3"
              >
                <span className="text-center text-sm tabular-nums text-white/35">
                  {index + 1}
                </span>

                <div className="relative size-10 shrink-0 overflow-hidden rounded-md ring-1 ring-white/10">
                  <Image
                    src={trackCover}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {t.title}
                  </p>
                  <p className="truncate text-xs text-white/40 sm:hidden">
                    {artistName}
                  </p>
                </div>

                <p className="hidden truncate text-sm text-white/55 sm:block">
                  {artistName}
                </p>

                <TrackDuration
                  seconds={t.duration_seconds}
                  className="hidden text-right text-sm tabular-nums text-white/40 sm:block"
                />

                <div className="flex items-center justify-end gap-0.5">
                  <TrackDuration
                    seconds={t.duration_seconds}
                    className="mr-1 text-sm tabular-nums text-white/40 sm:hidden"
                  />
                  <AddToPlaylistButton
                    trackId={t.id}
                    playlists={playlists}
                    isLoggedIn={!!user}
                  />
                  {t.audio_url ? (
                    <ReleaseTrackPlayButton track={uiTrack} queue={uiTracks} />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
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
                  <Image
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

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPlaylistById } from "@/lib/playlists/queries";
import { PlaylistForm } from "@/components/discover/PlaylistForm";
import { PlaylistTrackList } from "@/components/discover/PlaylistTrackList";
import { DeletePlaylistButton } from "@/components/discover/DeletePlaylistButton";
import { SavePlaylistButton } from "@/components/discover/SavePlaylistButton";
import { DetailHero } from "@/components/discover/DetailHero";
import { ShareButton } from "@/components/discover/ShareButton";
import { FALLBACK_COVER } from "@/lib/types/music";
import { formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function PlaylistDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const playlist = await getPlaylistById(id, user?.id ?? null);
  if (!playlist) {
    if (!user) {
      redirect(`/connexion?next=/discover/playlists/${id}`);
    }
    notFound();
  }

  // Privée + non connecté : on redirige plutôt que 404
  if (!playlist.is_public && !playlist.isOwner) {
    if (!user) {
      redirect(`/connexion?next=/discover/playlists/${id}`);
    }
    notFound();
  }

  const cover = playlist.cover_url || FALLBACK_COVER;
  const totalSeconds = playlist.tracks.reduce(
    (sum, track) => sum + (track.durationSeconds > 0 ? track.durationSeconds : 0),
    0,
  );
  const durationLabel = totalSeconds > 0 ? formatDuration(totalSeconds) : null;
  const meta = [
    `${playlist.tracksCount} titre${playlist.tracksCount > 1 ? "s" : ""}`,
    durationLabel ? `(${durationLabel})` : null,
    playlist.is_public
      ? `${playlist.savesCount} sauvegarde${playlist.savesCount > 1 ? "s" : ""}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="pb-16">
      <DetailHero
        kicker={playlist.is_public ? "Playlist publique" : "Playlist"}
        title={playlist.title}
        cover={cover}
        tracks={playlist.tracks}
        meta={meta}
        identity={
          playlist.description ? (
            <p className="max-w-xl text-sm text-white/60">
              {playlist.description}
            </p>
          ) : (
            <p className="text-sm text-white/55">
              {playlist.is_public
                ? "Playlist partagée sur Gootunes"
                : "Playlist personnelle"}
            </p>
          )
        }
        trailing={
          <>
            <ShareButton
              compact
              title={playlist.title}
              path={`/discover/playlists/${playlist.id}`}
            />
            {playlist.isOwner ? (
              <DeletePlaylistButton
                playlistId={playlist.id}
                title={playlist.title}
              />
            ) : playlist.is_public ? (
              user ? (
                <SavePlaylistButton
                  playlistId={playlist.id}
                  isSaved={playlist.isSaved}
                  savesCount={playlist.savesCount}
                />
              ) : (
                <Link
                  href={`/connexion?next=/discover/playlists/${playlist.id}`}
                  className="inline-flex h-11 items-center rounded-full border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Sauvegarder
                </Link>
              )
            ) : null}
          </>
        }
      />

      <section className="mt-2 sm:mt-4">
        <PlaylistTrackList
          playlistId={playlist.id}
          tracks={playlist.tracks}
          canEdit={playlist.isOwner}
        />
      </section>

      {playlist.isOwner ? (
        <details className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <summary className="cursor-pointer text-sm font-semibold text-white">
            Modifier la playlist
          </summary>
          <div className="mt-5">
            <PlaylistForm
              mode="edit"
              playlistId={playlist.id}
              initialTitle={playlist.title}
              initialDescription={playlist.description}
              initialCover={playlist.cover_url || ""}
              initialIsPublic={playlist.is_public}
            />
          </div>
        </details>
      ) : null}
    </div>
  );
}

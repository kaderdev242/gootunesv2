import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPlaylistById } from "@/lib/playlists/queries";
import { PlaylistForm } from "@/components/discover/PlaylistForm";
import { PlaylistTrackList } from "@/components/discover/PlaylistTrackList";
import { DeletePlaylistButton } from "@/components/discover/DeletePlaylistButton";
import { CoverAtmosphere } from "@/components/discover/CoverAtmosphere";
import { FALLBACK_COVER } from "@/lib/types/music";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function PlaylistDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/connexion?next=/discover/playlists/${id}`);
  }

  const playlist = await getPlaylistById(id, user.id);
  if (!playlist) notFound();

  const cover = playlist.cover_url || FALLBACK_COVER;

  return (
    <div className="mx-auto max-w-4xl pb-12">
      <Link
        href="/discover/playlists"
        className="text-sm text-white/45 transition hover:text-white"
      >
        ← Mes playlists
      </Link>

      <section className="relative mt-6 overflow-hidden rounded-[32px] border border-white/10">
        <CoverAtmosphere coverUrl={cover} intensity="panel" />
        <div className="relative flex flex-col gap-6 p-5 sm:flex-row sm:items-end sm:p-7">
          <div className="relative mx-auto aspect-square w-full max-w-[200px] overflow-hidden rounded-[24px] border border-white/15 shadow-2xl sm:mx-0 sm:w-[200px]">
            <Image
              src={cover}
              alt={playlist.title}
              fill
              className="object-cover"
              sizes="200px"
              priority
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-white/40 uppercase">
              Playlist · {playlist.tracksCount}{" "}
              {playlist.tracksCount > 1 ? "morceaux" : "morceau"}
            </p>
            <h1 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {playlist.title}
            </h1>
            {playlist.description ? (
              <p className="mt-3 text-sm text-white/55">{playlist.description}</p>
            ) : null}
            <div className="mt-4">
              <DeletePlaylistButton
                playlistId={playlist.id}
                title={playlist.title}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Morceaux</h2>
        <PlaylistTrackList
          playlistId={playlist.id}
          tracks={playlist.tracks}
        />
      </section>

      <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Modifier</h2>
        <PlaylistForm
          mode="edit"
          playlistId={playlist.id}
          initialTitle={playlist.title}
          initialDescription={playlist.description}
          initialCover={playlist.cover_url || ""}
        />
      </section>
    </div>
  );
}

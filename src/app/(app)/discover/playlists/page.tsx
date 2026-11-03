import { AppImage } from "@/components/media/AppImage";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Playlist02Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/server";
import { getUserPlaylists } from "@/lib/playlists/queries";
import { FALLBACK_COVER } from "@/lib/types/music";

export const dynamic = "force-dynamic";

export default async function PlaylistsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-bold text-white">Playlists</h1>
        <p className="mt-3 text-white/50">
          <Link
            href="/connexion?next=/discover/playlists"
            className="text-white underline"
          >
            Connecte-toi
          </Link>{" "}
          pour créer et gérer tes playlists.
        </p>
      </div>
    );
  }

  const playlists = await getUserPlaylists(user.id);

  return (
    <div className="mx-auto max-w-5xl pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">
            Playlists
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Organise tes morceaux préférés.
          </p>
        </div>
        <Link
          href="/discover/playlists/nouveau"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black"
        >
          <HugeiconsIcon icon={Add01Icon} size={16} />
          Créer
        </Link>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!playlists.length ? (
          <div className="col-span-full rounded-[28px] border border-dashed border-white/15 px-6 py-12 text-center">
            <HugeiconsIcon
              icon={Playlist02Icon}
              size={28}
              className="mx-auto text-white/30"
            />
            <p className="mt-3 text-sm text-white/45">
              Aucune playlist. Crée la première pour commencer.
            </p>
            <Link
              href="/discover/playlists/nouveau"
              className="mt-4 inline-flex text-sm font-medium text-white underline"
            >
              Nouvelle playlist
            </Link>
          </div>
        ) : (
          playlists.map((p) => (
            <Link
              key={p.id}
              href={`/discover/playlists/${p.id}`}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 transition hover:-translate-y-0.5 hover:border-white/20"
            >
              <div className="relative aspect-square bg-zinc-900">
                <AppImage
                  src={p.cover_url || FALLBACK_COVER}
                  alt={p.title}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  sizes="280px"
                />
              </div>
              <div className="space-y-1 px-4 py-4">
                <p className="truncate font-semibold text-white">{p.title}</p>
                <p className="line-clamp-2 text-xs text-white/40">
                  {p.description || "Sans description"}
                </p>
                <p className="pt-1 text-[11px] text-white/35">
                  {p.tracksCount}{" "}
                  {p.tracksCount > 1 ? "morceaux" : "morceau"}
                  {p.is_public ? " · Publique" : ""}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

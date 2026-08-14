import Image from "next/image";
import Link from "next/link";
import { DiscoverFooter } from "@/components/discover/DiscoverFooter";
import { getFeaturedAlbums } from "@/lib/discover/queries";

export const dynamic = "force-dynamic";

export default async function AlbumsPage() {
  const albums = await getFeaturedAlbums(48);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-4">
      <header>
        <Link
          href="/discover"
          className="text-sm text-white/45 transition hover:text-white"
        >
          ← Discover
        </Link>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-white">
          Albums à la une
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Albums et projets mis en avant.
        </p>
      </header>

      {albums.length === 0 ? (
        <p className="text-sm text-white/40">
          Aucun album publié pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/discover/release/${album.id}`}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 transition hover:-translate-y-0.5 hover:border-white/20"
            >
              <div className="relative aspect-square bg-zinc-900">
                <Image
                  src={album.cover}
                  alt={album.title}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  sizes="280px"
                />
              </div>
              <div className="space-y-1 px-4 py-4">
                <p className="truncate font-semibold text-white">{album.title}</p>
                <p className="truncate text-xs text-white/40">{album.artist}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <DiscoverFooter />
    </div>
  );
}

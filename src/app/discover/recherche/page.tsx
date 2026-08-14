import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { DiscoverSearchBar } from "@/components/discover/DiscoverSearchBar";
import { ReleaseCardGrid } from "@/components/discover/ReleaseCardGrid";
import { getViewerCountry } from "@/lib/auth/viewer-country";
import { searchDiscover } from "@/lib/discover/queries";
import { FALLBACK_COVER } from "@/lib/types/music";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function RecherchePage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  const [country, results] = await Promise.all([
    getViewerCountry(),
    query
      ? searchDiscover(query, 36)
      : Promise.resolve({ releases: [], artists: [], tracks: [] }),
  ]);

  const total =
    results.releases.length + results.artists.length + results.tracks.length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-8">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">
            Recherche
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Titres, albums, singles et artistes.
          </p>
        </div>
        <Suspense fallback={<div className="h-11 rounded-full bg-white/5" />}>
          <DiscoverSearchBar autoFocus />
        </Suspense>
      </header>

      {!query ? (
        <p className="text-sm text-white/40">
          Tape un mot-clé pour lancer une recherche.
        </p>
      ) : total === 0 ? (
        <p className="text-sm text-white/40">
          Aucun résultat pour « {query} ».
        </p>
      ) : (
        <div className="space-y-10">
          {results.artists.length > 0 ? (
            <section>
              <h2 className="font-display mb-4 text-2xl font-bold text-white">
                Artistes
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.artists.map((a) => (
                  <Link
                    key={a.id}
                    href={`/discover/artiste/${a.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]"
                  >
                    <div className="relative size-14 overflow-hidden rounded-full bg-zinc-900">
                      <Image
                        src={a.avatar_url || FALLBACK_COVER}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {a.name}
                      </p>
                      <p className="text-xs text-white/40">Artiste</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {results.releases.length > 0 ? (
            <section>
              <h2 className="font-display mb-4 text-2xl font-bold text-white">
                Albums & singles
              </h2>
              <ReleaseCardGrid
                country={country}
                items={results.releases.map((r) => ({
                  id: r.id,
                  title: r.title,
                  cover_url: r.cover_url,
                  genre: r.genre,
                  price_fcfa: r.price_fcfa,
                  type: r.type,
                  artistName: r.artistName,
                  created_at: "",
                }))}
              />
            </section>
          ) : null}

          {results.tracks.length > 0 ? (
            <section>
              <h2 className="font-display mb-4 text-2xl font-bold text-white">
                Titres
              </h2>
              <div className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.02] p-2">
                {results.tracks.map((t) => (
                  <Link
                    key={t.id}
                    href={`/discover/release/${t.releasePublicId}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5"
                  >
                    <div className="relative size-11 overflow-hidden rounded-lg bg-zinc-900">
                      <Image
                        src={t.cover_url || FALLBACK_COVER}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {t.title}
                      </p>
                      <p className="truncate text-xs text-white/40">
                        {t.artistName} · {t.releaseTitle}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

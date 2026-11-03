"use client";

import { AppImage } from "@/components/media/AppImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { FALLBACK_COVER } from "@/lib/types/music";
import {
  TrackArtistLine,
  TrackTitleLine,
} from "@/components/discover/ExplicitBadge";
import { VerifiedBadge } from "@/components/discover/VerifiedBadge";
import type {
  SearchHitArtist,
  SearchHitRelease,
  SearchHitTrack,
} from "@/lib/discover/queries";

type Results = {
  releases: SearchHitRelease[];
  artists: SearchHitArtist[];
  tracks: SearchHitTrack[];
};

const empty: Results = { releases: [], artists: [], tracks: [] };

export function DiscoverSearchBar({
  className = "",
  autoFocus = false,
  compact = false,
}: {
  className?: string;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results>(empty);
  const [, startTransition] = useTransition();

  const hasHits =
    results.releases.length + results.artists.length + results.tracks.length >
    0;

  const runSearch = useCallback(async (q: string) => {
    const term = q.trim();
    if (term.length < 1) {
      setResults(empty);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      if (!res.ok) throw new Error("search failed");
      const data = (await res.json()) as Results;
      setResults({
        releases: data.releases || [],
        artists: data.artists || [],
        tracks: data.tracks || [],
      });
    } catch {
      setResults(empty);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const term = value.trim();
    if (term.length < 1) {
      setResults(empty);
      return;
    }
    const t = window.setTimeout(() => {
      void runSearch(term);
    }, 220);
    return () => window.clearTimeout(t);
  }, [value, runSearch]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function goToSearchPage(q?: string) {
    const term = (q ?? value).trim();
    const href = term
      ? `/discover/recherche?q=${encodeURIComponent(term)}`
      : "/discover/recherche";
    setOpen(false);
    startTransition(() => router.push(href));
  }

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToSearchPage();
        }}
      >
        <HugeiconsIcon
          icon={Search01Icon}
          size={16}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-white/35"
        />
        <input
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher…"
          className={`w-full rounded-full border-0 bg-[#1a1a1a] pr-9 pl-10 text-sm text-white outline-none transition placeholder:text-white/35 focus:bg-[#222] ${
            compact ? "h-10" : "h-11"
          }`}
          aria-label="Rechercher"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open && value.trim().length > 0}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setResults(empty);
            }}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white"
            aria-label="Effacer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
          </button>
        ) : null}
      </form>

      {open && value.trim().length > 0 ? (
        <div
          id={listId}
          className="absolute top-[calc(100%+8px)] right-0 left-0 z-50 max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border border-white/10 bg-[#111] shadow-2xl shadow-black/60"
        >
          {loading ? (
            <p className="px-4 py-3 text-xs text-white/40">Recherche…</p>
          ) : !hasHits ? (
            <p className="px-4 py-3 text-xs text-white/40">
              Aucun résultat pour « {value.trim()} »
            </p>
          ) : (
            <div className="py-2">
              {results.artists.length > 0 ? (
                <ResultGroup title="Artistes">
                  {results.artists.map((a) => (
                    <Link
                      key={a.id}
                      href={`/discover/artiste/${a.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 transition hover:bg-white/8"
                    >
                      <div className="relative size-9 overflow-hidden rounded-full bg-zinc-800">
                        <AppImage
                          src={a.avatar_url || FALLBACK_COVER}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 truncate text-sm font-medium text-white">
                          <span className="truncate">{a.name}</span>
                          {a.verified ? (
                            <VerifiedBadge size={13} className="shrink-0" />
                          ) : null}
                        </p>
                        <p className="text-[11px] text-white/40">Artiste</p>
                      </div>
                    </Link>
                  ))}
                </ResultGroup>
              ) : null}

              {results.releases.length > 0 ? (
                <ResultGroup title="Albums & singles">
                  {results.releases.map((r) => (
                    <Link
                      key={r.id}
                      href={`/discover/release/${r.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 transition hover:bg-white/8"
                    >
                      <div className="relative size-9 overflow-hidden rounded-lg bg-zinc-800">
                        <AppImage
                          src={r.cover_url || FALLBACK_COVER}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <TrackTitleLine
                          title={r.title}
                          explicit={r.explicit}
                          className="truncate text-sm font-medium text-white"
                        />
                        <TrackArtistLine
                          artist={`${r.artistName} · ${
                            r.type === "album" ? "Album" : "Single"
                          }`}
                          verified={r.artistVerified}
                          className="text-[11px] text-white/40"
                        />
                      </div>
                    </Link>
                  ))}
                </ResultGroup>
              ) : null}

              {results.tracks.length > 0 ? (
                <ResultGroup title="Titres">
                  {results.tracks.map((t) => (
                    <Link
                      key={t.id}
                      href={`/discover/release/${t.releasePublicId}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 transition hover:bg-white/8"
                    >
                      <div className="relative size-9 overflow-hidden rounded-lg bg-zinc-800">
                        <AppImage
                          src={t.cover_url || FALLBACK_COVER}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      </div>
                      <div className="min-w-0">
                        <TrackTitleLine
                          title={t.title}
                          explicit={t.explicit}
                          className="truncate text-sm font-medium text-white"
                        />
                        <TrackArtistLine
                          artist={`${t.artistName} · ${t.releaseTitle}`}
                          verified={t.artistVerified}
                          className="text-[11px] text-white/40"
                        />
                      </div>
                    </Link>
                  ))}
                </ResultGroup>
              ) : null}

              <button
                type="button"
                onClick={() => goToSearchPage()}
                className="flex w-full items-center gap-2 border-t border-white/8 px-4 py-3 text-left text-xs font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                <HugeiconsIcon icon={Search01Icon} size={14} />
                Voir tous les résultats pour « {value.trim()} »
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ResultGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <p className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-white/35 uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

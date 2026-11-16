import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { BeatList } from "@/components/prods/BeatList";
import { MOODS } from "@/lib/prods/constants";
import {
  getViewerCountry,
  listBeatGenres,
  listBeats,
  type BeatFilters,
} from "@/lib/prods/queries";

type SP = Promise<Record<string, string | string[] | undefined>>;

const BPM_LABELS: Record<NonNullable<BeatFilters["bpm"]>, string> = {
  lent: "Lent < 90",
  moyen: "Moyen 90–119",
  rapide: "Rapide 120+",
};
const SORTS: Record<NonNullable<BeatFilters["tri"]>, string> = {
  recent: "Récentes",
  populaire: "Populaires",
  prix: "Prix",
};

function one(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

export default async function ProdsHomePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filters: BeatFilters = {
    q: one(sp.q),
    genre: one(sp.genre),
    mood: one(sp.mood),
    bpm: one(sp.bpm) as BeatFilters["bpm"],
    tri: (one(sp.tri) as BeatFilters["tri"]) || "recent",
  };
  const [beats, genres, country] = await Promise.all([
    listBeats(filters),
    listBeatGenres(),
    getViewerCountry(),
  ]);

  const href = (patch: Partial<BeatFilters>) => {
    const next = { ...filters, ...patch };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v && !(k === "tri" && v === "recent")) p.set(k, v);
    const s = p.toString();
    return s ? `/prods?${s}` : "/prods";
  };
  const hasFilters = Boolean(filters.q || filters.genre || filters.mood || filters.bpm);

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition ${
      active ? "bg-white text-black" : "bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white"
    }`;

  return (
    <>
      <section className="violet-wash relative -mx-4 overflow-hidden px-4 pb-12 pt-14 sm:mx-0 sm:mt-6 sm:rounded-[32px] sm:px-10">
        <div className="line-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative max-w-2xl">
          <p className="text-[13px] font-medium text-violet-200/80">Beatstore Gootunes</p>
          <h1 className="font-display mt-3 text-[40px] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[60px]">
            Trouve la prod
            <br />
            de ton prochain hit.
          </h1>
          <p className="mt-4 max-w-md text-[15px] text-white/60">
            Écoute les démos, choisis ta licence MP3, WAV ou stems, paie en Mobile Money et télécharge
            tout de suite.
          </p>
          <form action="/prods" method="get" className="mt-7 flex max-w-lg items-center gap-2 rounded-full border border-white/10 bg-black/50 p-1.5 pl-4 backdrop-blur">
            <HugeiconsIcon icon={Search01Icon} size={18} className="shrink-0 text-white/40" />
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Rechercher une prod…"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
            {filters.genre ? <input type="hidden" name="genre" value={filters.genre} /> : null}
            <button type="submit" className="h-10 rounded-full bg-white px-5 text-sm font-semibold text-black">
              Chercher
            </button>
          </form>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        {genres.length ? (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            <Link href={href({ genre: undefined })} className={chip(!filters.genre)}>
              Tous les genres
            </Link>
            {genres.map((g) => (
              <Link key={g} href={href({ genre: g })} className={chip(filters.genre === g)}>
                {g}
              </Link>
            ))}
          </div>
        ) : null}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {(Object.keys(BPM_LABELS) as (keyof typeof BPM_LABELS)[]).map((k) => (
            <Link key={k} href={href({ bpm: filters.bpm === k ? undefined : k })} className={chip(filters.bpm === k)}>
              {BPM_LABELS[k]}
            </Link>
          ))}
          <span className="mx-1 w-px shrink-0 bg-white/10" aria-hidden />
          {MOODS.map((m) => (
            <Link key={m} href={href({ mood: filters.mood === m ? undefined : m })} className={chip(filters.mood === m)}>
              {m}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-[-0.02em]">
              {filters.q ? `« ${filters.q} »` : filters.genre || "Dernières prods"}
            </h2>
            <p className="mt-1 text-sm text-white/45">
              {beats.length} prod{beats.length > 1 ? "s" : ""}
              {hasFilters ? (
                <>
                  {" · "}
                  <Link href="/prods" className="underline-offset-2 hover:text-white hover:underline">
                    Effacer les filtres
                  </Link>
                </>
              ) : null}
            </p>
          </div>
          <div className="flex gap-1 rounded-full bg-white/[0.06] p-1">
            {(Object.keys(SORTS) as (keyof typeof SORTS)[]).map((k) => (
              <Link
                key={k}
                href={href({ tri: k })}
                className={`rounded-full px-3 py-1 text-[13px] transition ${
                  filters.tri === k ? "bg-white text-black" : "text-white/60 hover:text-white"
                }`}
              >
                {SORTS[k]}
              </Link>
            ))}
          </div>
        </div>
        <BeatList beats={beats} country={country} />
      </section>
    </>
  );
}

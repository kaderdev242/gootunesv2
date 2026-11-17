import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { BeatDetailWave, BeatGrid, BeatPlayHero, BeatRows } from "@/components/prods/BeatList";
import { BeatmakerTiles } from "@/components/prods/BeatmakerTiles";
import { Section } from "@/components/prods/Section";
import { MOODS, tempoLabel } from "@/lib/prods/constants";
import {
  getOwnedBeatLicenses,
  getViewerCountry,
  listBeatGenres,
  listBeatmakers,
  listBeats,
  listTrendingBeats,
  type BeatFilters,
} from "@/lib/prods/queries";
import { FALLBACK_COVER } from "@/lib/types/music";

type SP = Promise<Record<string, string | string[] | undefined>>;

const BPM_LABELS: Record<NonNullable<BeatFilters["bpm"]>, string> = {
  lent: "< 90 BPM",
  moyen: "90–119 BPM",
  rapide: "120+ BPM",
};
const SORTS: Record<NonNullable<BeatFilters["tri"]>, string> = {
  recent: "Récentes",
  populaire: "Les plus écoutées",
  prix: "Prix croissant",
};

function one(v: string | string[] | undefined) {
  return typeof v === "string" && v.trim() ? v : undefined;
}

const chip = (active: boolean) =>
  `inline-flex h-8 shrink-0 items-center rounded-lg px-3 text-[13px] transition-colors ${
    active ? "bg-white text-black" : "bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white"
  }`;

export default async function ProdsHomePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filters: BeatFilters = {
    q: one(sp.q),
    genre: one(sp.genre),
    mood: one(sp.mood),
    bpm: one(sp.bpm) as BeatFilters["bpm"],
    tri: (one(sp.tri) as BeatFilters["tri"]) || "recent",
  };
  const all = one(sp.vue) === "toutes";
  const browsing = all || Boolean(filters.q || filters.genre || filters.mood || filters.bpm || filters.tri !== "recent");

  const [results, trending, genres, beatmakers, country, owned] = await Promise.all([
    listBeats(filters, browsing ? 60 : 15),
    browsing ? Promise.resolve([]) : listTrendingBeats(8),
    listBeatGenres(),
    browsing ? Promise.resolve([]) : listBeatmakers(6),
    getViewerCountry(),
    getOwnedBeatLicenses(),
  ]);

  const href = (patch: Partial<BeatFilters>) => {
    const next = { ...filters, ...patch };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v && !(k === "tri" && v === "recent")) p.set(k, v);
    const s = p.toString();
    return s ? `/prods?${s}` : "/prods";
  };

  const featured = trending[0] ?? results[0] ?? null;

  return (
    <>
      {/* Hero : texte et recherche à gauche, la prod du moment à droite */}
      <section className={`grid grid-cols-[minmax(0,1fr)] items-center gap-10 pb-4 pt-12 md:pt-16 ${featured && !browsing ? "lg:grid-cols-[minmax(0,1fr)_520px]" : ""}`}>
        <div className="max-w-xl">
          <h1 className="font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[56px]">
            Les prods des beatmakers d&apos;Afrique
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/55">
            Écoute les démos, choisis ta licence MP3, WAV ou stems et paie en Mobile Money. Les fichiers sans tag
            sont à toi tout de suite.
          </p>
          <form action="/prods" method="get" className="mt-8 flex max-w-lg items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] p-1.5 pl-4 focus-within:border-white/25">
            <HugeiconsIcon icon={Search01Icon} size={18} className="shrink-0 text-white/40" />
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Titre, genre ou tag"
              aria-label="Rechercher une prod"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
            <button type="submit" className="h-10 rounded-lg bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-white/90">
              Rechercher
            </button>
          </form>
          {genres.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {genres.slice(0, 8).map((g) => (
                <Link key={g.genre} href={href({ genre: filters.genre === g.genre ? undefined : g.genre })} className={chip(filters.genre === g.genre)}>
                  {g.genre}
                  <span className="ml-1.5 font-mono text-[11px] opacity-50">{g.count}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {featured && !browsing ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#121214] p-5">
            <div className="flex items-center gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-white/5 sm:size-28">
                <AppImage src={featured.cover_url || FALLBACK_COVER} alt="" fill sizes="112px" className="object-cover" priority />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-white/45">{trending[0] ? "La plus écoutée" : "Dernière sortie"}</p>
                <Link href={`/prods/b/${featured.public_id}`} className="mt-1 line-clamp-2 font-display text-[22px] font-semibold leading-tight tracking-[-0.02em] hover:underline">
                  {featured.title}
                </Link>
                <p className="truncate text-sm text-white/55">
                  {featured.artists?.stage_name}
                  {tempoLabel(featured) ? <span className="font-mono text-white/35"> · {tempoLabel(featured)}</span> : null}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <BeatDetailWave beat={featured} country={country} owned={owned} />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <BeatPlayHero beat={featured} country={country} owned={owned} />
              <a
                href={`/prods/b/${featured.public_id}#licences`}
                className="inline-flex h-11 items-center whitespace-nowrap rounded-lg px-4 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Voir les licences
              </a>
            </div>
          </div>
        ) : null}
      </section>

      {browsing ? (
        <section className="mt-10">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-[24px] font-semibold tracking-[-0.02em]">
                {filters.q ? `Résultats pour « ${filters.q} »` : filters.genre || SORTS[filters.tri || "recent"]}
              </h2>
              <p className="mt-1 text-sm text-white/45">
                {results.length} prod{results.length > 1 ? "s" : ""} ·{" "}
                <Link href="/prods" className="underline-offset-2 hover:text-white hover:underline">
                  Effacer les filtres
                </Link>
              </p>
            </div>
            <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
              {(Object.keys(SORTS) as (keyof typeof SORTS)[]).map((k) => (
                <Link key={k} href={href({ tri: k })} className={chip(filters.tri === k)}>
                  {SORTS[k]}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {(Object.keys(BPM_LABELS) as (keyof typeof BPM_LABELS)[]).map((k) => (
              <Link key={k} href={href({ bpm: filters.bpm === k ? undefined : k })} className={`${chip(filters.bpm === k)} font-mono`}>
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
          <div className="mt-6">
            {results.length ? (
              <BeatRows beats={results} country={country} owned={owned} />
            ) : (
              <p className="py-16 text-center text-sm text-white/50">Aucune prod pour ces filtres</p>
            )}
          </div>
        </section>
      ) : (
        <>
          {trending.length ? (
            <Section title="En tendance" href="/prods?tri=populaire">
              <BeatRows beats={trending} country={country} ranked owned={owned} />
            </Section>
          ) : null}

          <Section title="Nouvelles prods" href={results.length >= 15 ? "/prods?vue=toutes" : undefined}>
            {results.length ? (
              <BeatGrid beats={results} country={country} owned={owned} />
            ) : (
              <div className="rounded-xl border border-white/[0.06] px-6 py-12 text-center">
                <p className="font-medium text-white">Les premières prods arrivent</p>
                <p className="mt-1 text-sm text-white/50">Les beatmakers publient en ce moment. Reviens très vite</p>
              </div>
            )}
          </Section>

          {beatmakers.length ? (
            <Section title="Beatmakers" href="/prods/beatmakers">
              <BeatmakerTiles beatmakers={beatmakers} />
            </Section>
          ) : null}

          {genres.length ? (
            <Section title="Par genre">
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {genres.map((g) => (
                  <li key={g.genre}>
                    <Link
                      href={`/prods?genre=${encodeURIComponent(g.genre)}`}
                      className="flex h-20 flex-col justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05]"
                    >
                      <span className="truncate text-[15px] font-medium text-white">{g.genre}</span>
                      <span className="font-mono text-[11px] text-white/40">
                        {g.count} prod{g.count > 1 ? "s" : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </>
      )}
    </>
  );
}

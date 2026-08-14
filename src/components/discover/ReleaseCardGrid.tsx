import Image from "next/image";
import Link from "next/link";
import { FALLBACK_COVER } from "@/lib/types/music";
import { formatMoney } from "@/lib/format";

export type ReleaseCardItem = {
  id: string;
  title: string;
  cover_url?: string | null;
  genre?: string | null;
  price_fcfa?: number | null;
  artistName?: string | null;
  type?: string | null;
};

export function ReleaseCardGrid({
  items,
  emptyLabel = "Aucune sortie pour le moment.",
  country,
}: {
  items: ReleaseCardItem[];
  emptyLabel?: string;
  country?: string | null;
}) {
  if (!items.length) {
    return <p className="text-sm text-white/40">{emptyLabel}</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((r) => (
        <Link
          key={r.id}
          href={`/discover/release/${r.id}`}
          className="group overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 transition hover:-translate-y-0.5 hover:border-white/20"
        >
          <div className="relative aspect-square bg-zinc-900">
            <Image
              src={r.cover_url || FALLBACK_COVER}
              alt={r.title}
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              sizes="280px"
            />
          </div>
          <div className="space-y-1 px-4 py-4">
            <p className="truncate font-semibold text-white">{r.title}</p>
            <p className="truncate text-xs text-white/40">
              {r.artistName || "Artiste"}
              {r.genre ? ` · ${r.genre}` : ""}
            </p>
            {r.price_fcfa != null ? (
              <p className="pt-1 text-xs font-medium text-white/55">
                {formatMoney(Number(r.price_fcfa), country)}
              </p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

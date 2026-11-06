import Link from "next/link";
import { getPublicPlaylists } from "@/lib/playlists/queries";
import { FALLBACK_COVER } from "@/lib/types/music";
import { SectionScroller } from "@/components/feed/SectionScroller";
import { LazyCover } from "@/components/discover/LazyCover";

export async function PublicPlaylistsSection() {
  const playlists = await getPublicPlaylists(12);
  if (!playlists.length) return null;

  return (
    <SectionScroller title="Playlists" scrollAmount={280}>
      {playlists.map((p) => (
        <Link
          key={p.id}
          href={`/discover/playlists/${p.id}`}
          className="group w-[156px] shrink-0 sm:w-[176px]"
        >
          <div className="overflow-hidden rounded-md">
            <LazyCover
              src={p.cover_url || FALLBACK_COVER}
              alt={p.cover_url ? p.title : ""}
              sizes="176px"
              className="aspect-square bg-[#111]"
              imgClassName={`transition duration-300 ${
                p.cover_url ? "group-hover:brightness-110" : "opacity-40"
              }`}
            />
          </div>
          <p className="mt-2.5 line-clamp-2 text-sm font-medium leading-snug text-white">
            {p.title}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-white/45">
            {p.tracksCount}{" "}
            {p.tracksCount > 1 ? "titres" : "titre"}
            {typeof p.savesCount === "number" && p.savesCount > 0
              ? ` · ${p.savesCount} sav.`
              : ""}
          </p>
        </Link>
      ))}
    </SectionScroller>
  );
}

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_COVER } from "@/lib/types/music";
import { SectionScroller } from "@/components/feed/SectionScroller";
import { TrackArtistLine } from "@/components/discover/ExplicitBadge";

export async function CatalogSection() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  const supabase = await createClient();
  const { data: releases } = await supabase
    .from("releases")
    .select(
      "id, public_id, title, cover_url, genre, owner_id, price_fcfa, type, created_at, artist_id, artists(id, public_id, stage_name, avatar_url, country, bio), tracks(id, title, audio_url, track_number, duration_seconds, is_explicit)",
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(16);

  if (!releases?.length) return null;

  return (
    <SectionScroller
      title="Catalogue en vente"
      seeAllHref="/discover/catalogue"
      scrollAmount={280}
    >
      {releases.map((r) => {
        const artist = r.artists as {
          id?: string;
          public_id?: string;
          stage_name?: string;
        } | null;
        const tracks = (r.tracks as { is_explicit?: boolean }[] | null) || [];
        const explicit = tracks.some((t) => t.is_explicit);
        const artistName = artist?.stage_name || "Artiste";

        return (
          <Link
            key={r.id}
            href={`/discover/release/${r.public_id}`}
            className="w-[148px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 transition hover:-translate-y-0.5 hover:border-white/20 sm:w-[168px]"
          >
            <div className="relative aspect-square bg-zinc-900">
              {r.cover_url ? (
                <Image
                  src={r.cover_url}
                  alt={r.title}
                  fill
                  className="object-cover"
                  sizes="168px"
                />
              ) : (
                <Image
                  src={FALLBACK_COVER}
                  alt=""
                  fill
                  className="object-cover opacity-40"
                  sizes="168px"
                />
              )}
            </div>
            <div className="space-y-1 px-3 py-3">
              <p className="truncate text-sm font-semibold text-white">
                {r.title}
              </p>
              <TrackArtistLine
                artist={artistName}
                explicit={explicit}
                className="text-xs text-white/40"
              />
              {r.genre ? (
                <p className="truncate text-[11px] text-white/30">{r.genre}</p>
              ) : null}
            </div>
          </Link>
        );
      })}
    </SectionScroller>
  );
}

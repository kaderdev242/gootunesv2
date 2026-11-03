import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_COVER } from "@/lib/types/music";
import { SectionScroller } from "@/components/feed/SectionScroller";
import {
  TrackArtistLine,
  TrackTitleLine,
} from "@/components/discover/ExplicitBadge";
import { LazyCover } from "@/components/discover/LazyCover";

export async function CatalogSection() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  const supabase = await createClient();
  const { data: releases } = await supabase
    .from("releases")
    .select(
      "id, public_id, title, cover_url, genre, owner_id, price_fcfa, type, created_at, artist_id, artists(id, public_id, stage_name, avatar_url, country, bio, is_verified), tracks(id, title, audio_url, track_number, duration_seconds, is_explicit)",
    )
    .eq("status", "published")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(16);

  if (!releases?.length) return null;

  return (
    <SectionScroller
      title="Nouveautés du catalogue"
      seeAllHref="/discover/catalogue"
      scrollAmount={280}
    >
      {releases.map((r) => {
        const artist = r.artists as {
          id?: string;
          public_id?: string;
          stage_name?: string;
          is_verified?: boolean;
        } | null;
        const tracks = (r.tracks as { is_explicit?: boolean }[] | null) || [];
        const explicit = tracks.some((t) => t.is_explicit);
        const artistName = artist?.stage_name || "Artiste";

        return (
          <Link
            key={r.id}
            href={`/discover/release/${r.public_id}`}
            className="group w-[156px] shrink-0 sm:w-[176px]"
          >
            <div className="overflow-hidden rounded-md">
              <LazyCover
                src={r.cover_url || FALLBACK_COVER}
                alt={r.cover_url ? r.title : ""}
                sizes="176px"
                className="aspect-square bg-[#111]"
                imgClassName={`transition duration-300 ${r.cover_url ? "group-hover:scale-[1.03]" : "opacity-40"}`}
              />
            </div>
            <TrackTitleLine
              title={r.title}
              explicit={explicit}
              className="mt-2.5 line-clamp-2 text-sm font-medium leading-snug text-white"
            />
            <TrackArtistLine
              artist={artistName}
              verified={Boolean(artist?.is_verified)}
              className="mt-0.5 text-[13px] text-white/45"
            />
          </Link>
        );
      })}
    </SectionScroller>
  );
}

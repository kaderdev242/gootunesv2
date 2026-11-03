import { AppImage } from "@/components/media/AppImage";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { getCreatorStats } from "@/lib/stats/creator-stats";
import { StatsView } from "@/components/dashboard/StatsView";
import { getCountryLabel } from "@/lib/constants";
import { isCountryCode } from "@/lib/geo";
import { CountryFlag } from "@/components/auth/CountryFlag";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LabelArtistStatsPage({ params }: Props) {
  const { id } = await params;
  const session = await requireCreatorProfile("label");
  if (!session) redirect(`/connexion?next=/label/artistes/${id}`);

  const supabase = await createClient();
  const { data: artist } = await supabase
    .from("artists")
    .select("*")
    .eq("id", id)
    .eq("label_id", session.userId)
    .maybeSingle();

  if (!artist) notFound();

  const [{ count: releasesCount }, stats] = await Promise.all([
    supabase
      .from("releases")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", session.userId)
      .eq("artist_id", artist.id),
    getCreatorStats(session.userId, { artistId: artist.id }),
  ]);

  return (
    <StatsView
      stats={stats}
      country={session.profile.country}
      headerSlot={
        <header className="flex flex-col gap-5">
          <Link
            href="/label/artistes"
            className="w-fit text-sm text-white/45 transition hover:text-white"
          >
            ← Retour aux artistes
          </Link>

          <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-white/15 bg-zinc-900 sm:size-24">
              {artist.avatar_url ? (
                <AppImage
                  src={artist.avatar_url}
                  alt={artist.stage_name}
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized
                />
              ) : (
                <div className="flex size-full items-center justify-center text-2xl text-white/40">
                  {artist.stage_name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-white/35 uppercase">
                Stats artiste
              </p>
              <h1 className="font-display mt-1 text-3xl font-bold tracking-tight">
                {artist.stage_name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/50">
                {artist.country && isCountryCode(artist.country) ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CountryFlag
                      code={artist.country}
                      title={getCountryLabel(artist.country)}
                    />
                    {getCountryLabel(artist.country)}
                  </span>
                ) : (
                  <span>{getCountryLabel(artist.country)}</span>
                )}
                <span>·</span>
                <span>
                  {releasesCount ?? 0} publication
                  {(releasesCount ?? 0) > 1 ? "s" : ""}
                </span>
              </div>
              {artist.bio ? (
                <p className="mt-3 max-w-2xl text-sm text-white/45">{artist.bio}</p>
              ) : null}
            </div>
          </div>
        </header>
      }
    />
  );
}

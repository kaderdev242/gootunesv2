import { redirect } from "next/navigation";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { getCreatorStats } from "@/lib/stats/creator-stats";
import { StatsView } from "@/components/dashboard/StatsView";

export default async function ArtistStatsPage() {
  const session = await requireCreatorProfile("artist");
  if (!session) redirect("/connexion?next=/artist/statistiques");

  const stats = await getCreatorStats(session.userId);
  return <StatsView stats={stats} country={session.profile.country} />;
}

import { redirect } from "next/navigation";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { getCreatorStats } from "@/lib/stats/creator-stats";
import { StatsView } from "@/components/dashboard/StatsView";

export default async function LabelStatsPage() {
  const session = await requireCreatorProfile("label");
  if (!session) redirect("/connexion?next=/label/statistiques");

  const stats = await getCreatorStats(session.userId);
  return (
    <StatsView
      stats={stats}
      showByArtist
      country={session.profile.country}
    />
  );
}

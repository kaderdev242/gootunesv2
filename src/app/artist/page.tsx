import { redirect } from "next/navigation";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { getCreatorOverview } from "@/lib/dashboard/overview";
import { OverviewStats } from "@/components/dashboard/OverviewStats";

export default async function ArtistHomePage() {
  const session = await requireCreatorProfile("artist");
  if (!session) redirect("/connexion?next=/artist");

  const data = await getCreatorOverview(session.userId);

  return (
    <OverviewStats
      name={session.profile.display_name || "Mon espace"}
      basePath="/artist"
      balance={Number(session.profile.balance_fcfa)}
      country={session.profile.country}
      data={data}
    />
  );
}

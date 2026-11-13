import { redirect } from "next/navigation";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { getCreatorOverview } from "@/lib/dashboard/overview";
import { OverviewStats } from "@/components/dashboard/OverviewStats";
import { RetroTeaser } from "@/components/retro/RetroTeaser";
import { isFeatureEnabled } from "@/lib/features";

export default async function LabelHomePage() {
  const session = await requireCreatorProfile("label");
  if (!session) redirect("/connexion?next=/label");

  const [data, retro] = await Promise.all([
    getCreatorOverview(session.userId),
    isFeatureEnabled("retro"),
  ]);

  return (
    <div className="space-y-6">
      {retro ? <RetroTeaser basePath="/label" /> : null}
      <OverviewStats
      name={session.profile.display_name || "Mon label"}
      basePath="/label"
      balance={Number(session.profile.balance_fcfa)}
      country={session.profile.country}
      data={data}
      />
    </div>
  );
}

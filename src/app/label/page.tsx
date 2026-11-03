import { createClient } from "@/lib/supabase/server";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { OverviewStats } from "@/components/dashboard/OverviewStats";
import { redirect } from "next/navigation";

export default async function LabelHomePage() {
  const session = await requireCreatorProfile("label");
  if (!session) redirect("/connexion?next=/label");

  const supabase = await createClient();
  const { data: purchases } = await supabase
    .from("purchases")
    .select("amount_fcfa, artist_net_fcfa, created_at, status, payment_method")
    .eq("seller_id", session.userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const { count: releasesCount } = await supabase
    .from("releases")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", session.userId);

  const sales = purchases ?? [];
  const totalGross = sales.reduce((s, p) => s + Number(p.amount_fcfa), 0);
  const totalNet = sales.reduce((s, p) => s + Number(p.artist_net_fcfa), 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const bars = days.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const sum = sales
      .filter((p) => {
        const t = new Date(p.created_at).getTime();
        return t >= day.getTime() && t < next.getTime();
      })
      .reduce((s, p) => s + Number(p.artist_net_fcfa), 0);
    return {
      label: day.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      value: sum,
    };
  });

  return (
    <OverviewStats
      title={session.profile.display_name || "Ton label"}
      balance={Number(session.profile.balance_fcfa)}
      totalGross={totalGross}
      totalNet={totalNet}
      releasesCount={releasesCount ?? 0}
      bars={bars}
      sales={sales}
      country={session.profile.country}
    />
  );
}

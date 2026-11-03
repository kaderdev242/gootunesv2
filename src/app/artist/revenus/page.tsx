import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { CreatorRevenusView } from "@/components/dashboard/CreatorRevenusView";

export default async function RevenusPage() {
  const session = await requireCreatorProfile();
  if (!session) redirect("/connexion");

  const supabase = await createClient();
  const { data: purchases } = await supabase
    .from("purchases")
    .select("id, created_at, status, payment_method, artist_net_fcfa, releases(title)")
    .eq("seller_id", session.userId)
    .order("created_at", { ascending: false });

  const rows = (purchases ?? []).map((p) => ({
    id: p.id,
    created_at: p.created_at,
    status: p.status,
    payment_method: p.payment_method,
    artist_net_fcfa: p.artist_net_fcfa,
    releases: Array.isArray(p.releases)
      ? (p.releases[0] as { title?: string } | undefined) ?? null
      : (p.releases as { title?: string } | null),
  }));

  return (
    <CreatorRevenusView
      rows={rows}
      balanceFcfa={Number(session.profile.balance_fcfa)}
      country={session.profile.country}
    />
  );
}

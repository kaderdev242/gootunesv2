import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { WithdrawalsView } from "@/components/dashboard/WithdrawalsView";

export default async function RetraitsPage() {
  const session = await requireCreatorProfile();
  if (!session) redirect("/connexion");

  const supabase = await createClient();
  const { data: withdrawals } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("profile_id", session.userId)
    .order("created_at", { ascending: false });

  return (
    <WithdrawalsView
      balance={Number(session.profile.balance_fcfa)}
      country={session.profile.country}
      phone={session.profile.phone}
      withdrawals={withdrawals ?? []}
    />
  );
}

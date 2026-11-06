import { redirect } from "next/navigation";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { SubscriptionPlans } from "@/components/dashboard/SubscriptionPlans";
import { formatDate } from "@/lib/format";

export default async function AbonnementPage() {
  const session = await requireCreatorProfile();
  if (!session) redirect("/connexion");
  if (session.profile.role !== "label") redirect("/label");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[34px]">Abonnement Label</h1>
      <p className="mt-1 text-sm text-white/50">
        Plan actuel : <span className="text-white">{session.profile.label_plan}</span>
        {session.profile.label_plan_expires_at
          ? ` · expire le ${formatDate(session.profile.label_plan_expires_at)}`
          : null}
      </p>
      <div className="mt-8">
        <SubscriptionPlans
          current={session.profile.label_plan}
          country={session.profile.country}
          defaultPhone={session.profile.phone}
        />
      </div>
    </div>
  );
}

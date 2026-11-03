import { redirect } from "next/navigation";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { StudioCard, StudioPageHeader } from "@/components/studio/ui";

export default async function ParametresPage() {
  const session = await requireCreatorProfile();
  if (!session) redirect("/connexion");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <StudioPageHeader
        eyebrow="Compte"
        title="Paramètres"
        description={`${session.profile.email} · ${session.profile.role === "label" ? "label" : "artiste"}`}
      />
      <StudioCard className="sm:p-8">
        <ProfileForm profile={session.profile} />
      </StudioCard>
    </div>
  );
}

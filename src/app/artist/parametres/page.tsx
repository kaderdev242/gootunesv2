import { redirect } from "next/navigation";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { ProfileForm } from "@/components/dashboard/ProfileForm";

export default async function ParametresPage() {
  const session = await requireCreatorProfile();
  if (!session) redirect("/connexion");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold">Paramètres</h1>
      <p className="mt-1 text-sm text-white/45">
        {session.profile.email} · rôle {session.profile.role}
      </p>
      <div className="mt-8">
        <ProfileForm profile={session.profile} />
      </div>
    </div>
  );
}

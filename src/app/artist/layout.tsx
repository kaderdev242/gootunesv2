import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireCreatorProfile } from "@/lib/auth/get-profile";

export const dynamic = "force-dynamic";

export default async function ArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCreatorProfile("artist");
  if (!session) {
    const any = await requireCreatorProfile();
    if (any?.profile.role === "label") redirect("/label");
    redirect("/connexion?next=/artist");
  }
  if (!session.profile.onboarding_completed) redirect("/onboarding");

  return (
    <DashboardShell profile={session.profile} basePath="/artist">
      {children}
    </DashboardShell>
  );
}

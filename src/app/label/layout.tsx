import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { NOINDEX } from "@/lib/seo";
import { getEnabledFeatures } from "@/lib/features";

export const dynamic = "force-dynamic";
export const metadata: Metadata = NOINDEX;

export default async function LabelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCreatorProfile("label");
  if (!session) {
    const any = await requireCreatorProfile();
    if (any?.profile.role === "artist") redirect("/artist");
    redirect("/connexion?next=/label");
  }
  if (!session.profile.onboarding_completed) redirect("/onboarding");

  const features = await getEnabledFeatures();

  return (
    <DashboardShell profile={session.profile} basePath="/label" features={features}>
      {children}
    </DashboardShell>
  );
}

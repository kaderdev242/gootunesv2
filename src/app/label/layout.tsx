import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { NOINDEX } from "@/lib/seo";

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

  return (
    <DashboardShell profile={session.profile} basePath="/label">
      {children}
    </DashboardShell>
  );
}

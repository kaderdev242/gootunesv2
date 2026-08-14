import { redirect } from "next/navigation";
import { Logo } from "@/components/landing/Logo";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { getSessionProfile, homeForProfile } from "@/lib/auth/get-profile";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/connexion?next=/onboarding");

  const { profile } = session;
  if (profile.role !== "artist" && profile.role !== "label") {
    redirect("/discover");
  }
  if (profile.onboarding_completed) {
    redirect(homeForProfile(profile));
  }

  return (
    <div className="violet-wash relative min-h-dvh px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="line-grid absolute inset-0" />
        <div className="dot-grid absolute inset-0" />
      </div>
      <div className="relative z-10 mx-auto max-w-lg">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo size="md" priority />
        </Link>
        <div className="rounded-[32px] border border-white/10 bg-black/50 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
          <OnboardingWizard role={profile.role} />
        </div>
      </div>
    </div>
  );
}

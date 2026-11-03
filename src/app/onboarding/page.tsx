import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/landing/Logo";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { getSessionProfile, homeForProfile } from "@/lib/auth/get-profile";
import Link from "next/link";
import { NOINDEX } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = NOINDEX;

type Props = { searchParams: Promise<{ devenir?: string }> };

export default async function OnboardingPage({ searchParams }: Props) {
  const session = await getSessionProfile();
  if (!session) redirect("/connexion?next=/onboarding");

  const { profile } = session;
  const { devenir } = await searchParams;

  // Fan qui passe en compte créateur : le rôle ne change qu'à la fin de l'onboarding
  const conversionRole =
    profile.role === "fan" && (devenir === "artist" || devenir === "label")
      ? devenir
      : null;

  if (!conversionRole) {
    if (profile.role !== "artist" && profile.role !== "label") {
      redirect("/discover");
    }
    if (profile.onboarding_completed) {
      redirect(homeForProfile(profile));
    }
  }

  const role = conversionRole ?? (profile.role as "artist" | "label");

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
          {conversionRole ? (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-white/[0.05] px-4 py-3 text-sm text-white/60">
              <span>
                Passage en compte {conversionRole === "label" ? "label" : "artiste"}
              </span>
              <Link
                href="/discover/parametres"
                className="font-medium text-white/80 hover:text-white"
              >
                Annuler
              </Link>
            </div>
          ) : null}
          <OnboardingWizard
            key={role}
            role={role}
            conversion={Boolean(conversionRole)}
            defaults={
              conversionRole
                ? {
                    displayName: profile.display_name ?? "",
                    phone: profile.phone ?? "",
                    country: profile.country ?? "",
                    genres: profile.genres ?? [],
                    avatarUrl: profile.avatar_url ?? "",
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}

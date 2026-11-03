import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesBento } from "@/components/landing/FeaturesBento";
import { IndependentSection } from "@/components/landing/IndependentSection";
import { BehaviorTraits } from "@/components/landing/BehaviorTraits";
import { OpportunitiesSection } from "@/components/landing/OpportunitiesSection";
import { MovementSection } from "@/components/landing/MovementSection";
import { AppCtaSection } from "@/components/landing/AppCtaSection";
import { SiteFooter } from "@/components/landing/SiteFooter";

export const metadata: Metadata = {
  title: "Présentation",
  robots: { index: false, follow: false },
};

/** Landing marketing masquée — l’accueil public est Discover (`/`). */
export default function LandingPage() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-background">
      <HeroSection />
      <FeaturesBento />
      <IndependentSection />
      <BehaviorTraits />
      <OpportunitiesSection />
      <MovementSection />
      <AppCtaSection />
      <SiteFooter />
    </main>
  );
}

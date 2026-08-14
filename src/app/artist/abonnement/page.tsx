import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { ArtistSubscriptionPlans } from "@/components/dashboard/ArtistSubscriptionPlans";
import { hasActiveArtistPlan } from "@/lib/artist-plan";
import { formatDate } from "@/lib/format";

export default async function ArtistAbonnementPage() {
  const session = await requireCreatorProfile("artist");
  if (!session) redirect("/connexion?next=/artist/abonnement");

  const active = hasActiveArtistPlan(session.profile);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold">Abonnement Artiste</h1>
      <p className="mt-1 text-sm text-white/45">
        {active ? (
          <>
            Actif
            {session.profile.artist_plan_expires_at
              ? ` · expire le ${formatDate(session.profile.artist_plan_expires_at)}`
              : null}
          </>
        ) : (
          "Aucun abonnement actif — requis pour publier"
        )}
      </p>

      {!active ? (
        <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-50/90">
          Active ton abonnement annuel pour publier des singles et albums en
          illimité.{" "}
          <Link href="/artist/publications" className="underline">
            Voir les publications
          </Link>
        </div>
      ) : null}

      <div className="mt-8">
        <ArtistSubscriptionPlans
          currentPlan={session.profile.artist_plan || "none"}
          expiresAt={session.profile.artist_plan_expires_at}
          country={session.profile.country}
          defaultPhone={session.profile.phone}
        />
      </div>
    </div>
  );
}

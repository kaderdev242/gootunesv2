import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { AlbumPublishWizard } from "@/components/dashboard/publish/AlbumPublishWizard";
import { SinglePublishWizard } from "@/components/dashboard/publish/SinglePublishWizard";
import { hasActiveArtistPlan } from "@/lib/artist-plan";
import { ARTIST_PLAN } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import type { ReleaseType } from "@/lib/supabase/database.types";

export default async function PublierPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await requireCreatorProfile("artist");
  if (!session) redirect("/connexion?next=/artist/publier");

  if (!hasActiveArtistPlan(session.profile)) {
    return (
      <div className="mx-auto max-w-xl rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-center">
        <h1 className="font-display text-3xl font-bold">Abonnement requis</h1>
        <p className="mt-3 text-sm text-white/50">
          Pour publier sur Gootunes, active l&apos;abonnement artiste annuel (
          {formatMoney(ARTIST_PLAN.price, session.profile.country)} / an) —
          publications illimitées pendant 12 mois.
        </p>
        <Link
          href="/artist/abonnement"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black"
        >
          Activer l&apos;abonnement
        </Link>
      </div>
    );
  }

  const params = await searchParams;
  const type = params.type as ReleaseType | undefined;
  if (type !== "single" && type !== "album") {
    redirect("/artist/publications");
  }

  const supabase = await createClient();
  const { data: artists } = await supabase
    .from("artists")
    .select("*")
    .or(`owner_id.eq.${session.userId},label_id.eq.${session.userId}`)
    .order("stage_name");

  if (!artists?.length) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold">Publier</h1>
        <p className="mt-4 text-sm text-white/50">
          Aucun profil artiste trouvé.{" "}
          <Link href="/artist/publications" className="text-white underline">
            Retour aux publications
          </Link>
        </p>
      </div>
    );
  }

  return type === "album" ? (
    <AlbumPublishWizard
      artists={artists}
      basePath="/artist"
      country={session.profile.country}
    />
  ) : (
    <SinglePublishWizard
      artists={artists}
      basePath="/artist"
      country={session.profile.country}
    />
  );
}

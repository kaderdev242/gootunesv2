import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { AlbumPublishWizard } from "@/components/dashboard/publish/AlbumPublishWizard";
import { SinglePublishWizard } from "@/components/dashboard/publish/SinglePublishWizard";
import { BeatPublishWizard } from "@/components/dashboard/publish/BeatPublishWizard";
import { isFeatureEnabled } from "@/lib/features";
import type { ReleaseType } from "@/lib/supabase/database.types";

export default async function PublierPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await requireCreatorProfile("label");
  if (!session) redirect("/connexion?next=/label/publier");

  const params = await searchParams;
  const type = params.type as ReleaseType | "instrumental" | undefined;
  const instrumental = type === "instrumental" && (await isFeatureEnabled("prods"));
  if (type !== "single" && type !== "album" && !instrumental) {
    redirect("/label/publications");
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
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[34px]">Publier</h1>
        <p className="mt-4 text-sm text-white/50">
          Ajoute d&apos;abord un artiste à ton catalogue.{" "}
          <Link href="/label/artistes" className="text-white underline">
            Gérer les artistes
          </Link>
        </p>
      </div>
    );
  }

  if (instrumental) {
    return (
      <BeatPublishWizard
        artists={artists}
        basePath="/label"
        country={session.profile.country}
      />
    );
  }

  return type === "album" ? (
    <AlbumPublishWizard
      artists={artists}
      basePath="/label"
      country={session.profile.country}
    />
  ) : (
    <SinglePublishWizard
      artists={artists}
      basePath="/label"
      country={session.profile.country}
    />
  );
}

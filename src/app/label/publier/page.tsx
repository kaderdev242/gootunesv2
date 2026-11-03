import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { AlbumPublishWizard } from "@/components/dashboard/publish/AlbumPublishWizard";
import { SinglePublishWizard } from "@/components/dashboard/publish/SinglePublishWizard";
import type { ReleaseType } from "@/lib/supabase/database.types";

export default async function PublierPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await requireCreatorProfile("label");
  if (!session) redirect("/connexion?next=/label/publier");

  const params = await searchParams;
  const type = params.type as ReleaseType | undefined;
  if (type !== "single" && type !== "album") {
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
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-zinc-950 sm:text-[34px]">Publier</h1>
        <p className="mt-4 text-sm text-zinc-500">
          Ajoute d&apos;abord un artiste à ton catalogue.{" "}
          <Link href="/label/artistes" className="text-zinc-950 underline">
            Gérer les artistes
          </Link>
        </p>
      </div>
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

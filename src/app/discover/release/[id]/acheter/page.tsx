import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReleaseById } from "@/lib/discover/queries";
import { BuyReleaseForm } from "@/components/discover/BuyReleaseForm";
import { CoverAtmosphere } from "@/components/discover/CoverAtmosphere";
import { userOwnsRelease } from "@/lib/audio/access";
import { formatMoney } from "@/lib/format";
import { purchaseDevBypass } from "@/lib/mbiyo/config";
import { isUuid, releasePath } from "@/lib/public-id";
import { FALLBACK_COVER } from "@/lib/types/music";

type Props = { params: Promise<{ id: string }> };

export default async function AcheterReleasePage({ params }: Props) {
  const { id } = await params;
  const release = await getReleaseById(id);
  if (!release) notFound();

  if (isUuid(id) && release.public_id) {
    permanentRedirect(releasePath(release.public_id, "/acheter"));
  }

  const publicId = release.public_id;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/connexion?next=${releasePath(publicId, "/acheter")}`);
  }

  if (
    user.id === release.owner_id ||
    (await userOwnsRelease(user.id, release.id))
  ) {
    redirect(releasePath(publicId));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("country, phone")
    .eq("id", user.id)
    .maybeSingle();

  const artist = release.artists;
  const cover = release.cover_url || FALLBACK_COVER;
  const priceLabel = formatMoney(
    Number(release.price_fcfa),
    profile?.country,
  );
  const testBypass = purchaseDevBypass();

  return (
    <div className="mx-auto max-w-lg pb-12">
      <Link
        href={releasePath(publicId)}
        className="text-sm text-white/45 transition hover:text-white"
      >
        ← Retour au détail
      </Link>

      {testBypass ? (
        <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Mode test : les paiements réels sont désactivés. L’achat sera
          crédité immédiatement (sans Mobile Money).
        </p>
      ) : null}

      <div className="relative mt-6 overflow-hidden rounded-[28px] border border-white/10 p-5 sm:p-6">
        <CoverAtmosphere coverUrl={cover} intensity="panel" />
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/15">
              <Image
                src={cover}
                alt={release.title}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-white/40 uppercase">
                {release.type === "album" ? "Album" : "Single"}
              </p>
              <h1 className="truncate text-xl font-bold text-white">
                {release.title}
              </h1>
              <p className="truncate text-sm text-white/50">
                {artist?.stage_name || "Artiste"}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {priceLabel}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <BuyReleaseForm
              releaseId={release.id}
              releasePublicId={publicId}
              title={release.title}
              priceLabel={priceLabel}
              country={profile?.country}
              defaultPhone={profile?.phone}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

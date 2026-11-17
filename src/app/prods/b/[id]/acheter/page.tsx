import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppImage } from "@/components/media/AppImage";
import { BuyBeatForm } from "@/components/prods/BuyBeatForm";
import { formatMoney } from "@/lib/format";
import { purchaseDevBypass } from "@/lib/mbiyo/config";
import { beatPriceFor, isBeatLicense, LICENSE_ORDER, LICENSES, licenseCovered } from "@/lib/prods/constants";
import { getBeatByPublicId, getOwnedBeatLicenses } from "@/lib/prods/queries";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_COVER } from "@/lib/types/music";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ licence?: string }>;
};

export const metadata = { title: "Acheter une licence", robots: { index: false } };

export default async function BuyBeatPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const beat = await getBeatByPublicId(id);
  if (!beat) notFound();

  const owned = (await getOwnedBeatLicenses())[beat.id];
  // Seules les licences pas encore acquises (ni incluses dans une licence supérieure) sont proposées.
  const available = LICENSE_ORDER.filter((l) => beatPriceFor(beat, l) !== null && !licenseCovered(owned, l));
  if (!available.length) redirect(owned?.length ? "/prods/achats" : `/prods/b/${beat.public_id}`);
  const license = sp.licence && isBeatLicense(sp.licence) && available.includes(sp.licence) ? sp.licence : available[0];
  const path = `/prods/b/${beat.public_id}/acheter?licence=${license}`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(path)}`);
  if (user.id === beat.owner_id) redirect(`/prods/b/${beat.public_id}`);

  const { data: profile } = await supabase.from("profiles").select("country, phone").eq("id", user.id).maybeSingle();
  const price = beatPriceFor(beat, license)!;
  const priceLabel = formatMoney(price, profile?.country);

  return (
    <div className="mx-auto max-w-lg pt-6">
      <Link href={`/prods/b/${beat.public_id}`} className="text-sm text-white/45 transition hover:text-white">
        ← Retour à la prod
      </Link>

      {purchaseDevBypass() ? (
        <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Mode test : paiements réels désactivés, l’achat sera validé immédiatement.
        </p>
      ) : null}

      <div className="mt-6 rounded-xl border border-white/10 bg-[#0a0a0a] p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/15">
            <AppImage src={beat.cover_url || FALLBACK_COVER} alt="" fill sizes="80px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white/40">Prod. {beat.artists?.stage_name || "Beatmaker"}</p>
            <h1 className="truncate text-xl font-semibold text-white">{beat.title}</h1>
            <p className="mt-1 text-sm font-semibold text-white">{priceLabel}</p>
          </div>
        </div>

        {available.length > 1 ? (
          <div className="mt-6 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Licence">
            {available.map((l) => (
              <Link
                key={l}
                href={`/prods/b/${beat.public_id}/acheter?licence=${l}`}
                replace
                role="radio"
                aria-checked={l === license}
                className={`rounded-2xl border px-3 py-3 text-center transition ${
                  l === license ? "border-white/40 bg-white/[0.06]" : "border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                <span className="block text-[13px] font-semibold text-white">{LICENSES[l].name.replace("Licence ", "")}</span>
                <span className="mt-0.5 block text-xs text-white/50">{formatMoney(beatPriceFor(beat, l)!, profile?.country)}</span>
              </Link>
            ))}
          </div>
        ) : null}

        <p className="mt-5 text-xs text-white/45">
          Inclus : {LICENSES[license].perks.join(" · ")}
        </p>

        <div className="mt-5">
          <BuyBeatForm
            key={license}
            beatPublicId={beat.public_id}
            license={license}
            priceLabel={priceLabel}
            country={profile?.country}
            defaultPhone={profile?.phone}
          />
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney } from "@/lib/format";
import { FALLBACK_COVER } from "@/lib/types/music";

export const dynamic = "force-dynamic";

export default async function BibliothequePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-bold text-white">
          Bibliothèque
        </h1>
        <p className="mt-3 text-white/50">
          <Link
            href="/connexion?next=/discover/bibliotheque"
            className="text-white underline"
          >
            Connecte-toi
          </Link>{" "}
          pour voir tes achats.
        </p>
      </div>
    );
  }

  const [{ data: items }, { data: profile }] = await Promise.all([
    supabase
      .from("library_items")
      .select(
        "id, created_at, releases(id, public_id, title, cover_url, price_fcfa, genre, type, artists(stage_name))",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("country")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const country = profile?.country;

  return (
    <div className="mx-auto max-w-4xl pb-8">
      <header>
        <h1 className="font-display text-4xl font-bold text-white">
          Bibliothèque
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Tes sorties achetées — écoute complète sans limite.
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-3">
        {!items?.length ? (
          <p className="text-sm text-white/40">
            Bibliothèque vide.{" "}
            <Link href="/discover" className="text-white underline">
              Explore Discover
            </Link>{" "}
            pour acheter une sortie.
          </p>
        ) : (
          items.map((item) => {
            const release = item.releases as {
              id: string;
              public_id: string;
              title: string;
              cover_url: string | null;
              price_fcfa?: number;
              genre?: string | null;
              type?: string | null;
              artists: { stage_name?: string } | null;
            } | null;
            if (!release) return null;

            return (
              <Link
                key={item.id}
                href={`/discover/release/${release.public_id}`}
                className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="relative size-14 overflow-hidden rounded-xl bg-zinc-800">
                  <Image
                    src={release.cover_url || FALLBACK_COVER}
                    alt={release.title}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {release.title}
                  </p>
                  <p className="text-xs text-white/40">
                    {release.artists?.stage_name || "Artiste"}
                    {release.genre ? ` · ${release.genre}` : ""}
                    {" · "}
                    acheté le {formatDate(item.created_at)}
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-200 sm:inline">
                  Acheté
                  {release.price_fcfa != null
                    ? ` · ${formatMoney(Number(release.price_fcfa), country)}`
                    : ""}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

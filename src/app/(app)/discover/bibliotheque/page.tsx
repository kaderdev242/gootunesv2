import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney } from "@/lib/format";
import { FALLBACK_COVER } from "@/lib/types/music";
import { LibraryCollection } from "@/components/discover/LibraryCollection";
import { NOINDEX } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = NOINDEX;

export default async function BibliothequePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-xl pt-6">
        <p className="text-[12px] font-medium text-white/40">
          Collection
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Bibliothèque
        </h1>
        <p className="mt-3 text-sm text-white/50">
          Tes albums et singles achetés, en grilles comme une collection.
        </p>
        <Link
          href="/connexion?next=/discover/bibliotheque"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-black"
        >
          Se connecter
        </Link>
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
  const cards = (items || []).flatMap((item) => {
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
    if (!release) return [];
    const type = (release.type === "album" ? "album" : "single") as
      | "album"
      | "single";
    return [
      {
        id: item.id,
        href: `/discover/release/${release.public_id}`,
        title: release.title,
        artist: release.artists?.stage_name || "Artiste",
        cover: release.cover_url || FALLBACK_COVER,
        type,
        meta: `Acheté le ${formatDate(item.created_at)}${
          release.price_fcfa != null
            ? ` · ${formatMoney(Number(release.price_fcfa), country)}`
            : ""
        }`,
      },
    ];
  });

  return (
    <div className="pb-8">
      <header className="mb-8">
        <p className="text-[12px] font-medium text-white/40">
          Collection
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Bibliothèque
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/45">
          Tes sorties achetées — écoute complète, classée comme une collection.
        </p>
      </header>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/12 px-6 py-16 text-center">
          <p className="text-sm text-white/45">Bibliothèque vide.</p>
          <Link
            href="/"
            className="mt-4 inline-flex text-sm font-medium text-white underline"
          >
            Explorer le catalogue
          </Link>
        </div>
      ) : (
        <LibraryCollection items={cards} />
      )}
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { ReleaseCardGrid } from "@/components/discover/ReleaseCardGrid";
import { DiscoverFooter } from "@/components/discover/DiscoverFooter";
import { getViewerCountry } from "@/lib/auth/viewer-country";
import { getCatalogReleases } from "@/lib/discover/queries";
import { listPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = listPageMetadata({
  title: "Catalogue en vente",
  description:
    "Parcours toutes les sorties publiées sur Gootunes. Achète singles et albums via Mobile Money, 80 % reversés aux artistes.",
  path: "/discover/catalogue",
});

type Props = { searchParams: Promise<{ page?: string }> };

export default async function CataloguePage({ searchParams }: Props) {
  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);

  const [catalog, country] = await Promise.all([
    getCatalogReleases({ limit: 48, page }),
    getViewerCountry(),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-4">
      <header>
        <Link
          href="/"
          className="text-sm text-white/45 transition hover:text-white"
        >
          ← Discover
        </Link>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-white">
          Catalogue en vente
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Toutes les sorties publiées disponibles à l’achat.
        </p>
      </header>

      <ReleaseCardGrid
        items={catalog.items}
        country={country}
        emptyLabel="Aucune sortie en vente pour le moment."
      />

      {(page > 1 || catalog.hasMore) && (
        <nav className="flex items-center justify-between gap-4 text-sm">
          {page > 1 ? (
            <Link
              href={`/discover/catalogue?page=${page - 1}`}
              className="rounded-full border border-white/15 px-4 py-2 text-white/80 transition hover:border-white/30 hover:text-white"
            >
              ← Précédent
            </Link>
          ) : (
            <span />
          )}
          <span className="text-white/40">Page {page}</span>
          {catalog.hasMore ? (
            <Link
              href={`/discover/catalogue?page=${page + 1}`}
              className="rounded-full border border-white/15 px-4 py-2 text-white/80 transition hover:border-white/30 hover:text-white"
            >
              Suivant →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}

      <DiscoverFooter />
    </div>
  );
}

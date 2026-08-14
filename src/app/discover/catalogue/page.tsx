import Link from "next/link";
import { ReleaseCardGrid } from "@/components/discover/ReleaseCardGrid";
import { DiscoverFooter } from "@/components/discover/DiscoverFooter";
import { getViewerCountry } from "@/lib/auth/viewer-country";
import { getCatalogReleases } from "@/lib/discover/queries";

export const dynamic = "force-dynamic";

export default async function CataloguePage() {
  const [releases, country] = await Promise.all([
    getCatalogReleases({ limit: 60 }),
    getViewerCountry(),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-4">
      <header>
        <Link
          href="/discover"
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
        items={releases}
        country={country}
        emptyLabel="Aucune sortie en vente pour le moment."
      />

      <DiscoverFooter />
    </div>
  );
}

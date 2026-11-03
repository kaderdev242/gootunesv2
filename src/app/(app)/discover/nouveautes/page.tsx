import type { Metadata } from "next";
import { ReleaseCardGrid } from "@/components/discover/ReleaseCardGrid";
import { getViewerCountry } from "@/lib/auth/viewer-country";
import { getCatalogReleases } from "@/lib/discover/queries";
import { listPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = listPageMetadata({
  title: "Nouveautés",
  description:
    "Les nouveautés du catalogue Gootunes. Fresh drops d’artistes africains à acheter en Mobile Money.",
  path: "/discover/nouveautes",
});

export default async function NouveautesPage() {
  const [catalog, country] = await Promise.all([
    getCatalogReleases({ limit: 48 }),
    getViewerCountry(),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-8">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-tight text-white">
          Nouveautés
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Les dernières sorties publiées sur Gootunes.
        </p>
      </header>

      <ReleaseCardGrid
        items={catalog.items}
        country={country}
        emptyLabel="Aucune nouveauté pour le moment."
      />
    </div>
  );
}

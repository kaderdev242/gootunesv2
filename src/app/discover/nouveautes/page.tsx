import { ReleaseCardGrid } from "@/components/discover/ReleaseCardGrid";
import { getViewerCountry } from "@/lib/auth/viewer-country";
import { getCatalogReleases } from "@/lib/discover/queries";

export const dynamic = "force-dynamic";

export default async function NouveautesPage() {
  const [releases, country] = await Promise.all([
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
        items={releases}
        country={country}
        emptyLabel="Aucune nouveauté pour le moment."
      />
    </div>
  );
}

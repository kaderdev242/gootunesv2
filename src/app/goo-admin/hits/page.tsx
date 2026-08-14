import {
  listEditorialHitsAdmin,
  searchCatalogForHits,
} from "@/lib/admin/queries";
import { AdminHitsView } from "@/components/admin/AdminHitsView";

export default async function AdminHitsPage() {
  const [hits, candidates] = await Promise.all([
    listEditorialHitsAdmin(),
    searchCatalogForHits("", 40),
  ]);

  return <AdminHitsView hits={hits} initialCandidates={candidates} />;
}

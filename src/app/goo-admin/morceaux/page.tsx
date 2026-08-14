import { listReleasesAdmin } from "@/lib/admin/queries";
import {
  AdminMorceauxView,
  type AdminReleaseRow,
} from "@/components/admin/AdminMorceauxView";

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] || null : v;
}

export default async function AdminMorceauxPage() {
  const releases = await listReleasesAdmin();

  const rows: AdminReleaseRow[] = releases.map((r) => {
    const artist = one(
      r.artists as { stage_name: string } | { stage_name: string }[] | null,
    );
    const owner = one(
      r.profiles as
        | { display_name: string | null; email: string | null }
        | { display_name: string | null; email: string | null }[]
        | null,
    );
    return {
      id: r.id,
      publicId: r.public_id,
      title: r.title,
      type: r.type,
      status: r.status,
      price_fcfa: r.price_fcfa,
      genre: r.genre,
      cover_url: r.cover_url,
      is_hidden: r.is_hidden,
      created_at: r.created_at,
      artistName: artist?.stage_name || owner?.display_name || "—",
      ownerEmail: owner?.email || null,
    };
  });

  return <AdminMorceauxView releases={rows} />;
}

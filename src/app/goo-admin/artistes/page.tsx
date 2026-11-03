import {
  listArtistsAdmin,
  listProfilesByRole,
} from "@/lib/admin/queries";
import {
  AdminArtistesView,
  type AdminCatalogArtistRow,
  type AdminCreatorRow,
} from "@/components/admin/AdminArtistesView";

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] || null : v;
}

export default async function AdminArtistesPage() {
  const [artists, labels, catalogArtists] = await Promise.all([
    listProfilesByRole("artist"),
    listProfilesByRole("label"),
    listArtistsAdmin(),
  ]);

  const catalogByOwner = new Map<string, string>();
  for (const a of catalogArtists) {
    if (!catalogByOwner.has(a.owner_id)) {
      catalogByOwner.set(a.owner_id, a.id);
    }
  }

  const rows: AdminCreatorRow[] = [
    ...artists.map((p) => ({
      id: p.id,
      email: p.email,
      display_name: p.display_name,
      role: p.role,
      country: p.country,
      is_suspended: p.is_suspended,
      created_at: p.created_at,
      artist_plan: p.artist_plan,
      artist_plan_expires_at: p.artist_plan_expires_at,
      label_plan: p.label_plan,
      label_plan_expires_at: p.label_plan_expires_at,
      kind: "Artiste" as const,
      catalogId: catalogByOwner.get(p.id) || null,
    })),
    ...labels.map((p) => ({
      id: p.id,
      email: p.email,
      display_name: p.display_name,
      role: p.role,
      country: p.country,
      is_suspended: p.is_suspended,
      created_at: p.created_at,
      artist_plan: p.artist_plan,
      artist_plan_expires_at: p.artist_plan_expires_at,
      label_plan: p.label_plan,
      label_plan_expires_at: p.label_plan_expires_at,
      kind: "Label" as const,
      catalogId: catalogByOwner.get(p.id) || null,
    })),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const catalog: AdminCatalogArtistRow[] = catalogArtists.map((a) => {
    const owner = one(
      a.profiles as
        | {
            display_name: string | null;
            email: string | null;
            role: string;
          }
        | {
            display_name: string | null;
            email: string | null;
            role: string;
          }[]
        | null,
    );
    return {
      id: a.id,
      public_id: a.public_id,
      stage_name: a.stage_name,
      avatar_url: a.avatar_url,
      is_verified: Boolean(a.is_verified),
      owner_id: a.owner_id,
      ownerName: owner?.display_name || "—",
      ownerEmail: owner?.email || "—",
      ownerRole: owner?.role || "",
    };
  });

  return <AdminArtistesView rows={rows} catalogArtists={catalog} />;
}

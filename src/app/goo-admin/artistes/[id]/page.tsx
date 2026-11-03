import { notFound } from "next/navigation";
import { getArtistAdminDetail } from "@/lib/admin/queries";
import { AdminArtistDetailView } from "@/components/admin/AdminArtistDetailView";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminArtistDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getArtistAdminDetail(id);
  if (!data) notFound();
  return <AdminArtistDetailView data={data} />;
}

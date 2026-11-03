import { listProfilesByRole } from "@/lib/admin/queries";
import { AdminFansView } from "@/components/admin/AdminFansView";

export default async function AdminFansPage() {
  const fans = await listProfilesByRole("fan");
  return (
    <AdminFansView
      fans={fans.map((p) => ({
        id: p.id,
        display_name: p.display_name,
        email: p.email,
        country: p.country,
        created_at: p.created_at,
        is_suspended: p.is_suspended,
      }))}
    />
  );
}

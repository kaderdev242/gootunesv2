import { getAdminAnalytics } from "@/lib/admin/queries";
import { AdminStatsView } from "@/components/admin/AdminStatsView";

export default async function AdminStatsPage() {
  const data = await getAdminAnalytics();
  return <AdminStatsView data={data} />;
}

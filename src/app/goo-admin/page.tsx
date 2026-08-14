import { getAdminDashboard } from "@/lib/admin/queries";
import { AdminOverview } from "@/components/admin/AdminOverview";

export default async function GooAdminHomePage() {
  const data = await getAdminDashboard();
  return <AdminOverview data={data} />;
}

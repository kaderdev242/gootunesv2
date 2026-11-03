import { listAdminSubscriptionRevenue } from "@/lib/admin/queries";
import { AdminSubscriptionsView } from "@/components/admin/AdminSubscriptionsView";

export const dynamic = "force-dynamic";

export default async function AdminAbonnementsPage() {
  const data = await listAdminSubscriptionRevenue();
  return <AdminSubscriptionsView data={data} />;
}

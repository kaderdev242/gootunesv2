import { listAdminLedger } from "@/lib/admin/queries";
import { AdminTransactionsView } from "@/components/admin/AdminTransactionsView";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage() {
  const rows = await listAdminLedger();
  return <AdminTransactionsView rows={rows} />;
}

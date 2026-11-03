import { listSystemLogsAdmin } from "@/lib/admin/queries";
import { AdminSystemLogsView } from "@/components/admin/AdminSystemLogsView";

export const dynamic = "force-dynamic";

export default async function AdminSystemLogsPage() {
  const logs = await listSystemLogsAdmin();
  return <AdminSystemLogsView logs={logs} />;
}

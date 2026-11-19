import { AdminContractsView } from "@/components/admin/contracts/AdminContractsView";
import { listContractsAdmin } from "@/lib/contracts/admin-queries";
import { CONTRACT_VERSION_LABEL } from "@/lib/contracts/template";

export default async function AdminContratsPage() {
  const rows = await listContractsAdmin();
  return <AdminContractsView rows={rows} version={CONTRACT_VERSION_LABEL.replace("Version du ", "")} />;
}

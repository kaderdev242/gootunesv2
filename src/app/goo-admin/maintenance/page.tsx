import { getSiteSettings } from "@/lib/admin/queries";
import { MaintenanceForm } from "@/components/admin/AdminActionForms";

export default async function AdminMaintenancePage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Maintenance
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Bloque l&apos;accès public pendant une opération. Seul `/goo-admin`
          reste accessible.
        </p>
      </header>

      <div className="max-w-xl space-y-4 rounded-[28px] border border-zinc-200/80 bg-white p-6 shadow-sm shadow-zinc-900/5">
        <div className="flex items-center gap-3">
          <span
            className={`size-2.5 rounded-full ${
              settings.maintenance_enabled ? "bg-amber-500" : "bg-emerald-500"
            }`}
          />
          <p className="text-sm font-medium text-zinc-800">
            {settings.maintenance_enabled
              ? "Maintenance active"
              : "Site en ligne"}
          </p>
        </div>

        <MaintenanceForm
          enabled={settings.maintenance_enabled}
          message={settings.maintenance_message}
        />

        <p className="text-xs text-zinc-400">
          Mis à jour :{" "}
          {new Date(settings.updated_at).toLocaleString("fr-FR")}
        </p>
      </div>
    </div>
  );
}

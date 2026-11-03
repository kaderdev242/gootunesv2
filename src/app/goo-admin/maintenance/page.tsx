import { getSiteSettings } from "@/lib/admin/queries";
import { MaintenanceForm } from "@/components/admin/AdminActionForms";
import { ConsoleHeader, Panel, Pill } from "@/components/admin/console/ui";

export default async function AdminMaintenancePage() {
  const settings = await getSiteSettings();
  const on = settings.maintenance_enabled;

  return (
    <div className="space-y-5">
      <ConsoleHeader
        kicker="Système"
        title="Maintenance"
        description="Bloque l'accès public pendant une opération. La console admin reste accessible."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <section
          className={`relative overflow-hidden rounded-2xl border p-6 ${
            on
              ? "border-amber-400/25 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(245,158,11,0.18),transparent_60%),#141210]"
              : "border-emerald-400/20 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(16,185,129,0.14),transparent_60%),#0f1412]"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex size-3">
              <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${on ? "bg-amber-400" : "bg-emerald-400"}`} />
              <span className={`relative inline-flex size-3 rounded-full ${on ? "bg-amber-400" : "bg-emerald-400"}`} />
            </span>
            <Pill tone={on ? "warn" : "ok"}>{on ? "Maintenance active" : "Opérationnel"}</Pill>
          </div>
          <p className="mt-5 text-[28px] font-semibold tracking-[-0.02em] text-white">
            {on ? "Le site est fermé au public" : "Le site est en ligne"}
          </p>
          <p className="mt-2 text-[13px] text-zinc-400">
            {on
              ? "Les visiteurs voient le message de maintenance. Pense à le désactiver après l'opération."
              : "Tout le monde peut accéder à Gootunes normalement."}
          </p>
          <p className="mt-6 text-[11px] text-zinc-500">
            Dernière modification : {new Date(settings.updated_at).toLocaleString("fr-FR")}
          </p>
        </section>

        <Panel title="Réglages" subtitle="Le message est affiché à tous les visiteurs pendant la maintenance.">
          <MaintenanceForm enabled={settings.maintenance_enabled} message={settings.maintenance_message} />
        </Panel>
      </div>
    </div>
  );
}

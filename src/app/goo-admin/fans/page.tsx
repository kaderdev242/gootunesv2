import { listProfilesByRole } from "@/lib/admin/queries";
import { SuspendUserButton } from "@/components/admin/AdminActionForms";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default async function AdminFansPage() {
  const fans = await listProfilesByRole("fan");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Fans"
        description={`${fans.length} comptes`}
      />

      <div className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-sm shadow-zinc-900/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs text-zinc-400">
              <tr>
                <th className="px-5 py-3.5 font-medium">Compte</th>
                <th className="px-5 py-3.5 font-medium">Pays</th>
                <th className="px-5 py-3.5 font-medium">Inscrit</th>
                <th className="px-5 py-3.5 font-medium">Statut</th>
                <th className="px-5 py-3.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {fans.map((p) => (
                <tr key={p.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-zinc-900">
                      {p.display_name || "—"}
                    </p>
                    <p className="text-xs text-zinc-400">{p.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500">
                    {p.country || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500">
                    {new Date(p.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-3.5">
                    {p.is_suspended ? (
                      <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        Suspendu
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        Actif
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <SuspendUserButton
                      userId={p.id}
                      suspended={p.is_suspended}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

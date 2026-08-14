import { listProfilesByRole } from "@/lib/admin/queries";
import { SuspendUserButton } from "@/components/admin/AdminActionForms";

export default async function AdminArtistesPage() {
  const [artists, labels] = await Promise.all([
    listProfilesByRole("artist"),
    listProfilesByRole("label"),
  ]);

  const rows = [
    ...artists.map((p) => ({ ...p, kind: "Artiste" as const })),
    ...labels.map((p) => ({ ...p, kind: "Label" as const })),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Artistes & labels
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {rows.length} comptes créateurs
        </p>
      </header>

      <div className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-sm shadow-zinc-900/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs text-zinc-400">
              <tr>
                <th className="px-5 py-3.5 font-medium">Compte</th>
                <th className="px-5 py-3.5 font-medium">Type</th>
                <th className="px-5 py-3.5 font-medium">Pays</th>
                <th className="px-5 py-3.5 font-medium">Solde</th>
                <th className="px-5 py-3.5 font-medium">Statut</th>
                <th className="px-5 py-3.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-zinc-900">
                      {p.display_name || "—"}
                    </p>
                    <p className="text-xs text-zinc-400">{p.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600">{p.kind}</td>
                  <td className="px-5 py-3.5 text-zinc-500">
                    {p.country || "—"}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-zinc-700">
                    {(p.balance_fcfa || 0).toLocaleString("fr-FR")}
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

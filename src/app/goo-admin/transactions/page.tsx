import { listPurchasesAdmin, listWithdrawalsAdmin } from "@/lib/admin/queries";
import { PaymentStatusBadge } from "@/components/admin/PaymentStatusBadge";
import { formatFcfa } from "@/lib/format";

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] || null : v;
}

export default async function AdminTransactionsPage() {
  const [purchases, withdrawals] = await Promise.all([
    listPurchasesAdmin(),
    listWithdrawalsAdmin(),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Transactions
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Achats et retraits récents
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-700">Achats</h2>
        <div className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-sm shadow-zinc-900/5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Date</th>
                  <th className="px-5 py-3.5 font-medium">Release</th>
                  <th className="px-5 py-3.5 font-medium">Acheteur</th>
                  <th className="px-5 py-3.5 font-medium">Vendeur</th>
                  <th className="px-5 py-3.5 font-medium">Montant</th>
                  <th className="px-5 py-3.5 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => {
                  const release = one(
                    p.releases as { title: string } | { title: string }[] | null,
                  );
                  const buyer = one(
                    p.buyer as
                      | { display_name: string | null; email: string | null }
                      | { display_name: string | null; email: string | null }[]
                      | null,
                  );
                  const seller = one(
                    p.seller as
                      | { display_name: string | null; email: string | null }
                      | { display_name: string | null; email: string | null }[]
                      | null,
                  );
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="px-5 py-3.5 text-zinc-500">
                        {new Date(p.created_at).toLocaleString("fr-FR")}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-800">
                        {release?.title || "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-zinc-800">
                          {buyer?.display_name || "—"}
                        </p>
                        <p className="text-xs text-zinc-400">{buyer?.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-zinc-800">
                          {seller?.display_name || "—"}
                        </p>
                        <p className="text-xs text-zinc-400">{seller?.email}</p>
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-zinc-800">
                        {formatFcfa(p.amount_fcfa || 0)}
                        <span className="block text-[11px] text-zinc-400">
                          com. {formatFcfa(p.commission_fcfa || 0)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <PaymentStatusBadge status={p.status} />
                        <span className="mt-1 block text-[11px] text-zinc-400">
                          {p.payment_method} · {p.provider}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-700">Retraits</h2>
        <div className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-sm shadow-zinc-900/5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Date</th>
                  <th className="px-5 py-3.5 font-medium">Compte</th>
                  <th className="px-5 py-3.5 font-medium">Montant</th>
                  <th className="px-5 py-3.5 font-medium">Téléphone</th>
                  <th className="px-5 py-3.5 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => {
                  const profile = one(
                    w.profiles as
                      | { display_name: string | null; email: string | null }
                      | { display_name: string | null; email: string | null }[]
                      | null,
                  );
                  return (
                    <tr
                      key={w.id}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="px-5 py-3.5 text-zinc-500">
                        {new Date(w.created_at).toLocaleString("fr-FR")}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-zinc-800">
                          {profile?.display_name || "—"}
                        </p>
                        <p className="text-xs text-zinc-400">{profile?.email}</p>
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-zinc-800">
                        {formatFcfa(w.amount_fcfa || 0)}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600">{w.phone}</td>
                      <td className="px-5 py-3.5">
                        <PaymentStatusBadge status={w.status} />
                        <span className="mt-1 block text-[11px] text-zinc-400">
                          {w.payment_method}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

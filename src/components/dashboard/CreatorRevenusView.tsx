import { HugeiconsIcon } from "@hugeicons/react";
import {
  Money01Icon,
  SmartPhone01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { formatMoney, formatDate } from "@/lib/format";
import { isApplePaymentMethod } from "@/lib/purchases/apple-tiers";
import {
  StatCard,
  StudioCard,
  StudioCardHeader,
  StudioEmpty,
  StudioPageHeader,
} from "@/components/studio/ui";

type PurchaseRow = {
  id: string;
  created_at: string;
  status: string;
  payment_method: string;
  artist_net_fcfa: number;
  releases: { title?: string } | null;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  completed: { label: "Payé", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/15" },
  pending: { label: "En attente", cls: "bg-amber-50 text-amber-800 ring-amber-600/15" },
  failed: { label: "Échec", cls: "bg-red-50 text-red-600 ring-red-600/15" },
};

export function CreatorRevenusView({
  rows,
  balanceFcfa,
  country,
}: {
  rows: PurchaseRow[];
  balanceFcfa: number;
  country?: string | null;
}) {
  const money = (n: number) => formatMoney(n, country);
  const completed = rows.filter((p) => p.status === "completed");
  const momoNet = completed
    .filter((p) => !isApplePaymentMethod(p.payment_method))
    .reduce((s, p) => s + Number(p.artist_net_fcfa), 0);
  const appleNet = completed
    .filter((p) => isApplePaymentMethod(p.payment_method))
    .reduce((s, p) => s + Number(p.artist_net_fcfa), 0);

  return (
    <div className="space-y-4">
      <StudioPageHeader
        eyebrow="Finances"
        title="Revenus"
        description="Chaque vente, ce que tu as touché et d'où ça vient."
      />

      <div className="grid gap-4 pt-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Solde retirable"
          value={money(balanceFcfa)}
          hint="en Mobile Money"
          icon={Wallet01Icon}
          tone="accent"
        />
        <StatCard
          label="Net cumulé"
          value={money(momoNet + appleNet)}
          hint={`${completed.length} vente${completed.length > 1 ? "s" : ""} réglée${completed.length > 1 ? "s" : ""}`}
          tone="ink"
        />
        <StatCard
          label="Net Mobile Money"
          value={money(momoNet)}
          hint="tu gardes 80 %"
          icon={Money01Icon}
        />
        <StatCard
          label="Net iOS"
          value={money(appleNet)}
          hint="tu gardes 70 %"
          icon={SmartPhone01Icon}
        />
      </div>

      <StudioCard padded={false} className="overflow-hidden">
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <StudioCardHeader
            title="Historique des ventes"
            subtitle={`${rows.length} transaction${rows.length > 1 ? "s" : ""}`}
          />
        </div>
        {rows.length === 0 ? (
          <div className="p-5 sm:p-6">
            <StudioEmpty
              title="Aucune transaction"
              description="Tes ventes apparaîtront ici dès le premier achat."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-[11px] text-zinc-400">
                  <th className="px-5 py-2.5 font-medium sm:px-6">Sortie</th>
                  <th className="px-3 py-2.5 font-medium">Date</th>
                  <th className="px-3 py-2.5 font-medium">Canal</th>
                  <th className="px-3 py-2.5 font-medium">Statut</th>
                  <th className="px-5 py-2.5 text-right font-medium sm:px-6">Net</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const apple = isApplePaymentMethod(p.payment_method);
                  const st = STATUS[p.status] ?? {
                    label: p.status,
                    cls: "bg-zinc-100 text-zinc-600 ring-black/5",
                  };
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-black/[0.05] transition hover:bg-zinc-50/70"
                    >
                      <td className="px-5 py-3 font-semibold text-zinc-900 sm:px-6">
                        {p.releases?.title || "Sortie"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-zinc-500">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-zinc-600">
                        <span className="inline-flex items-center gap-1.5">
                          <HugeiconsIcon
                            icon={apple ? SmartPhone01Icon : Money01Icon}
                            size={14}
                            className="text-zinc-400"
                          />
                          {apple ? "iOS · 70 %" : "Mobile Money · 80 %"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-zinc-950 sm:px-6">
                        +{money(Number(p.artist_net_fcfa))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </StudioCard>
    </div>
  );
}

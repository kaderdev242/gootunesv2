import { formatMoney, formatDate } from "@/lib/format";
import { isApplePaymentMethod } from "@/lib/purchases/apple-tiers";

type PurchaseRow = {
  id: string;
  created_at: string;
  status: string;
  payment_method: string;
  artist_net_fcfa: number;
  releases: { title?: string } | null;
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
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-bold">Revenus</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/45">Net Mobile Money (80 %)</p>
          <p className="mt-2 text-2xl font-bold">{money(momoNet)}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/45">Net iOS (70 %)</p>
          <p className="mt-2 text-2xl font-bold">{money(appleNet)}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:col-span-2 lg:col-span-1">
          <p className="text-xs text-white/45">Net cumulé</p>
          <p className="mt-2 text-2xl font-bold">{money(momoNet + appleNet)}</p>
        </div>
        <div className="rounded-3xl border border-white/15 bg-white/5 p-5">
          <p className="text-xs text-white/45">Solde retirable (MoMo)</p>
          <p className="mt-2 text-2xl font-bold">{money(balanceFcfa)}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2">
        {rows.length === 0 ? (
          <p className="text-sm text-white/40">Aucune transaction.</p>
        ) : (
          rows.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm sm:grid-cols-5"
            >
              <span className="text-white/50">{formatDate(p.created_at)}</span>
              <span className="truncate font-medium text-white sm:col-span-2">
                {p.releases?.title || "Release"}
              </span>
              <span className="text-white/60">
                {isApplePaymentMethod(p.payment_method)
                  ? "iOS · 70 %"
                  : "MoMo · 80 %"}
              </span>
              <span className="text-right font-semibold text-white">
                +{money(Number(p.artist_net_fcfa))}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

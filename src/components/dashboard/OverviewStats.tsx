import { formatMoney } from "@/lib/format";

type Bar = { label: string; value: number };
type Sale = { created_at: string; artist_net_fcfa: number };

export function OverviewStats({
  title,
  subtitle,
  balance,
  totalGross,
  totalNet,
  releasesCount,
  bars,
  sales,
  country,
}: {
  title: string;
  subtitle: string;
  balance: number;
  totalGross: number;
  totalNet: number;
  releasesCount: number;
  bars: Bar[];
  sales: Sale[];
  country?: string | null;
}) {
  const maxBar = Math.max(...bars.map((b) => b.value), 1);
  const money = (n: number) => formatMoney(n, country);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-white/35 uppercase">
            Vue d&apos;ensemble
          </p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-white/45">{subtitle}</p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Solde disponible", value: money(balance), accent: true },
          { label: "Ventes brutes", value: money(totalGross) },
          { label: "Net (80%)", value: money(totalNet) },
          { label: "Publications", value: String(releasesCount) },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-3xl border p-5 ${
              card.accent
                ? "violet-card border-white/15"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <p className="text-xs text-white/45">{card.label}</p>
            <p className="font-display mt-2 text-2xl font-bold text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Revenus nets (7 jours)</h2>
        <div className="mt-6 flex h-48 items-end gap-2 sm:gap-3">
          {bars.map((bar) => (
            <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full max-w-[48px] rounded-t-2xl bg-white/20 transition hover:bg-white/40"
                style={{ height: `${Math.max(8, (bar.value / maxBar) * 100)}%` }}
                title={money(bar.value)}
              />
              <span className="text-[10px] text-white/40">{bar.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">Dernières ventes</h2>
        {sales.length === 0 ? (
          <p className="text-sm text-white/40">
            Aucune vente pour le moment. Publie un single ou un album pour
            commencer.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {sales.slice(0, 8).map((sale, i) => (
              <div
                key={`${sale.created_at}-${i}`}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm"
              >
                <span className="text-white/60">
                  {new Date(sale.created_at).toLocaleString("fr-FR")}
                </span>
                <span className="font-semibold text-white">
                  +{money(Number(sale.artist_net_fcfa))}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

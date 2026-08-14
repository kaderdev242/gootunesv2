import Image from "next/image";
import { formatFcfa } from "@/lib/format";
import { isCountryCode } from "@/lib/geo";
import { CountryFlag } from "@/components/auth/CountryFlag";
import type { getAdminAnalytics } from "@/lib/admin/queries";

type Analytics = Awaited<ReturnType<typeof getAdminAnalytics>>;

function PeriodCard({
  title,
  data,
}: {
  title: string;
  data: Analytics["periods"]["day"];
}) {
  return (
    <div className="rounded-[24px] border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {title}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
        {formatFcfa(data.totalAmount)}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        {data.totalCount} vente{data.totalCount > 1 ? "s" : ""}
      </p>
      <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 text-xs">
        <div className="flex justify-between text-zinc-600">
          <span>Morceaux</span>
          <span className="font-medium">
            {data.musicCount} · {formatFcfa(data.musicAmount)}
          </span>
        </div>
        <div className="flex justify-between text-zinc-600">
          <span>Abonnements label</span>
          <span className="font-medium">
            {data.labelCount} · {formatFcfa(data.labelAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CountryBars({
  rows,
  mode,
}: {
  rows: { country: string; label: string; count: number; amount?: number }[];
  mode: "users" | "buyers";
}) {
  const max = Math.max(
    ...rows.map((r) => (mode === "buyers" ? r.amount || 0 : r.count)),
    1,
  );

  if (!rows.length) {
    return <p className="text-sm text-zinc-400">Pas encore de données.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.slice(0, 6).map((row) => {
        const value = mode === "buyers" ? row.amount || 0 : row.count;
        return (
          <div key={row.country}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-medium text-zinc-800">
                {row.country !== "—" && isCountryCode(row.country) ? (
                  <CountryFlag code={row.country} className="h-3.5 w-5" />
                ) : null}
                {row.label}
              </span>
              <span className="text-xs text-zinc-500">
                {mode === "buyers"
                  ? `${row.count} · ${formatFcfa(row.amount || 0)}`
                  : `${row.count} comptes`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.max(6, (value / max) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AdminStatsView({ data }: { data: Analytics }) {
  const maxDay = Math.max(...data.dailySales.map((d) => d.total), 1);
  const musicShare =
    data.productMix.musicAmount + data.productMix.labelAmount > 0
      ? Math.round(
          (data.productMix.musicAmount /
            (data.productMix.musicAmount + data.productMix.labelAmount)) *
            100,
        )
      : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Statistiques
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Origine des utilisateurs, pays d&apos;achat, ventes et mix produits
        </p>
      </header>

      {/* Periods */}
      <section className="grid gap-3 md:grid-cols-3">
        <PeriodCard title="Aujourd'hui" data={data.periods.day} />
        <PeriodCard title="7 derniers jours" data={data.periods.week} />
        <PeriodCard title="30 derniers jours" data={data.periods.month} />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Countries users */}
        <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-900">
            Où viennent les utilisateurs ?
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Répartition par pays de profil · {data.totals.users} comptes
            analysés
          </p>
          <div className="mt-5">
            <CountryBars rows={data.usersByCountry} mode="users" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1">
              {data.totals.fans} fans
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1">
              {data.totals.artists} artistes
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1">
              {data.totals.labels} labels
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1">
              {data.totals.plays.toLocaleString("fr-FR")} écoutes
            </span>
          </div>
        </section>

        {/* Countries buyers */}
        <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-900">
            Quels pays achètent le plus ?
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Volume d&apos;achats complétés par pays de l&apos;acheteur
          </p>
          <div className="mt-5">
            <CountryBars rows={data.buyersByCountry} mode="buyers" />
          </div>
        </section>
      </div>

      {/* Daily chart + product mix */}
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-zinc-900">
              Ventes journalières
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" /> Morceaux
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-zinc-400" /> Abonnements
              </span>
            </div>
          </div>
          <div className="mt-6 flex h-48 items-end gap-1.5 sm:gap-2">
            {data.dailySales.map((d) => {
              const hPx = Math.max(d.total > 0 ? 12 : 4, (d.total / maxDay) * 160);
              return (
                <div
                  key={d.key}
                  className="flex flex-1 flex-col items-center gap-2"
                  title={`${d.dayLabel}: ${formatFcfa(d.total)} (morceaux ${formatFcfa(d.music)} · abo ${formatFcfa(d.subscriptions)})`}
                >
                  <div
                    className="flex w-full max-w-[28px] flex-col justify-end overflow-hidden rounded-t-lg"
                    style={{ height: hPx }}
                  >
                    {d.subscriptions > 0 ? (
                      <div
                        className="w-full bg-zinc-400"
                        style={{ flex: d.subscriptions }}
                      />
                    ) : null}
                    {d.music > 0 ? (
                      <div
                        className="w-full bg-emerald-500"
                        style={{ flex: d.music }}
                      />
                    ) : null}
                    {d.total === 0 ? (
                      <div className="h-1 w-full bg-zinc-100" />
                    ) : null}
                  </div>
                  <span className="text-[9px] text-zinc-400 sm:text-[10px]">
                    {d.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-900">
            Qu&apos;achètent-ils ?
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Mix morceaux vs abonnements label (historiques complétés)
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="font-medium text-zinc-800">Morceaux</span>
                <span className="text-zinc-500">
                  {data.productMix.musicCount} ·{" "}
                  {formatFcfa(data.productMix.musicAmount)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${musicShare}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="font-medium text-zinc-800">
                  Abonnements label
                </span>
                <span className="text-zinc-500">
                  {data.productMix.labelCount} ·{" "}
                  {formatFcfa(data.productMix.labelAmount)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-zinc-400"
                  style={{ width: `${100 - musicShare}%` }}
                />
              </div>
              <div className="mt-2 flex gap-2 text-[11px] text-zinc-500">
                <span className="rounded-full bg-zinc-100 px-2 py-0.5">
                  Starter {data.productMix.labelPlans.starter}
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5">
                  Unlimited {data.productMix.labelPlans.unlimited}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-zinc-50 px-4 py-3">
            <p className="text-xs text-zinc-400">Commission (30 j)</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">
              {formatFcfa(data.totals.commissionMonth)}
            </p>
          </div>
        </section>
      </div>

      {/* Top releases */}
      <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/5 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">
          Morceaux les plus vendus
        </h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {data.topReleases.length === 0 ? (
            <p className="text-sm text-zinc-400">Aucune vente pour le moment.</p>
          ) : (
            data.topReleases.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-2xl border border-zinc-100 px-3 py-2.5"
              >
                <span className="w-5 text-sm text-zinc-300">{i + 1}</span>
                <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                  {r.cover ? (
                    <Image
                      src={r.cover}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {r.title}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {r.type} · {r.count} vente{r.count > 1 ? "s" : ""}
                  </p>
                </div>
                <p className="text-xs font-semibold text-emerald-700">
                  {formatFcfa(r.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

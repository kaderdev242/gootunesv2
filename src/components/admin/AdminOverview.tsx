import Link from "next/link";
import { AnalyticsUpIcon, Money01Icon } from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { formatFcfa } from "@/lib/format";
import { FALLBACK_COVER } from "@/lib/types/music";
import { PaymentStatusBadge } from "@/components/admin/PaymentStatusBadge";
import {
  ConsoleEmpty,
  ConsoleHeader,
  ConsoleLink,
  Initial,
  Kpi,
  KpiGrid,
  Panel,
  T,
} from "@/components/admin/console/ui";
import { LineChart } from "@/components/admin/console/LineChart";
import type { getAdminDashboard } from "@/lib/admin/queries";

type Dashboard = Awaited<ReturnType<typeof getAdminDashboard>>;

export function AdminOverview({ data }: { data: Dashboard }) {
  const period = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const mix = data.collectionMix;
  const series = (data.salesByDay30 ?? []).map((d) => ({ key: d.key, value: d.amount }));
  const total30 = series.reduce((s, d) => s + d.value, 0);
  const split = [
    { label: "Versé aux artistes", amount: mix.artistNet, pct: mix.artistNetPct },
    { label: "Commission Gootunes", amount: mix.commission, pct: mix.commissionPct },
    { label: "Abonnements", amount: mix.subscriptions, pct: mix.subscriptionsPct },
  ];

  return (
    <div className="space-y-6">
      <ConsoleHeader
        title="Vue d'ensemble"
        description={`Plateforme · ${period}`}
        actions={
          <>
            <ConsoleLink href="/goo-admin/stats" icon={AnalyticsUpIcon}>
              Statistiques
            </ConsoleLink>
            <ConsoleLink href="/goo-admin/transactions" tone="primary" icon={Money01Icon}>
              Transactions
            </ConsoleLink>
          </>
        }
      />

      <KpiGrid cols={4}>
        <Kpi highlight label="Revenu Gootunes, 30 jours" value={formatFcfa(data.platformRevenue30d)} delta={data.platformRevenueChangePct} />
        <Kpi label="Ventes de musique" value={formatFcfa(data.musicGmv30d)} delta={data.musicGmvChangePct} />
        <Kpi label="Versé aux artistes" value={formatFcfa(data.artistNet30d)} delta={data.artistNetChangePct} />
        <Kpi label="Abonnements" value={formatFcfa(data.subscriptions30d)} delta={data.subscriptionsChangePct} />
      </KpiGrid>

      <div className="grid gap-4 xl:grid-cols-[1.9fr_1fr]">
        <Panel title="Ventes" subtitle={`Musique et abonnements · 30 derniers jours · ${formatFcfa(total30)}`}>
          <LineChart points={series} height={260} />
          <div className="mt-6 grid gap-4 border-t border-white/[0.06] pt-5 sm:grid-cols-3">
            {split.map((s) => (
              <div key={s.label}>
                <p className="text-[12px] text-white/45">{s.label}</p>
                <p className="mt-1 text-[16px] font-semibold tabular-nums text-white">
                  {formatFcfa(s.amount)}
                </p>
                <p className="font-mono text-[11px] text-white/35">{s.pct} % des encaissements</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="À traiter" subtitle="Ce qui attend une action de ta part">
          <div className="space-y-6">
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[14px] text-white">Retraits en attente</p>
                <p className="font-mono text-[12px] text-white/45">{data.pendingWithdrawalsCount}</p>
              </div>
              <p className="mt-1 text-[22px] font-semibold tabular-nums text-white">
                {formatFcfa(data.pendingWithdrawalsFcfa)}
              </p>
              <ul className="mt-3 space-y-1">
                {data.pendingWithdrawals.length === 0 ? (
                  <li className="text-[13px] text-white/40">Aucun retrait en attente</li>
                ) : (
                  data.pendingWithdrawals.slice(0, 4).map((w) => (
                    <li key={w.id} className="flex items-center gap-3 py-1.5">
                      <Initial name={w.name} className="size-8 text-[12px]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] text-white">{w.name}</p>
                        <p className="font-mono text-[11px] text-white/40">{w.phone}</p>
                      </div>
                      <p className="shrink-0 text-[14px] tabular-nums text-white">{formatFcfa(w.amount)}</p>
                    </li>
                  ))
                )}
              </ul>
              {data.pendingWithdrawalsCount > 0 ? (
                <div className="mt-3">
                  <ConsoleLink href="/goo-admin/transactions" tone="primary" size="sm">
                    Traiter les retraits
                  </ConsoleLink>
                </div>
              ) : null}
            </div>

            <div className="space-y-1 border-t border-white/[0.06] pt-4">
              <Link
                href="/goo-admin/signalements?status=open"
                className="flex h-10 items-center justify-between rounded-xl px-3 text-[14px] text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                Signalements ouverts
                <span className={`font-mono text-[13px] ${data.openReports > 0 ? "text-red-300" : "text-white/40"}`}>
                  {data.openReports}
                </span>
              </Link>
              <Link
                href="/goo-admin/fans"
                className="flex h-10 items-center justify-between rounded-xl px-3 text-[14px] text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                Inscrits aujourd&apos;hui
                <span className="font-mono text-[13px] text-white/40">
                  +{data.usersToday} · {data.usersTotal.toLocaleString("fr-FR")} au total
                </span>
              </Link>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.9fr_1fr]">
        <Panel
          flush
          title="Dernières transactions"
          subtitle="Achats de musique"
          actions={
            <Link href="/goo-admin/transactions" className="text-[13px] text-white/50 transition-colors hover:text-white">
              Tout voir
            </Link>
          }
        >
          <div className={T.wrap}>
            <table className={`${T.table} min-w-[620px]`}>
              <thead className={T.thead}>
                <tr>
                  <th className={T.th}>Produit</th>
                  <th className={T.th}>Date</th>
                  <th className={`${T.th} text-right`}>Montant</th>
                  <th className={`${T.th} text-right`}>Commission</th>
                  <th className={T.th}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <ConsoleEmpty title="Aucune transaction récente" />
                    </td>
                  </tr>
                ) : (
                  data.recentPurchases.map((p) => (
                    <tr key={p.id} className={T.tr}>
                      <td className={T.td}>
                        <p className={T.strong}>{p.title}</p>
                        <p className={T.sub}>
                          {p.buyer}
                          {p.orderId ? <span className="font-mono"> · {p.orderId}</span> : null}
                        </p>
                      </td>
                      <td className={`${T.td} whitespace-nowrap text-white/50`}>
                        {new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </td>
                      <td className={`${T.td} ${T.num} text-right`}>{formatFcfa(p.amount)}</td>
                      <td className={`${T.td} text-right tabular-nums text-white/50`}>{formatFcfa(p.commission)}</td>
                      <td className={T.td}>
                        <PaymentStatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Sorties récentes"
          actions={
            <Link href="/goo-admin/morceaux" className="text-[13px] text-white/50 transition-colors hover:text-white">
              Catalogue
            </Link>
          }
        >
          {data.popularReleases.length === 0 ? (
            <ConsoleEmpty title="Aucune publication" />
          ) : (
            <ul className="space-y-3">
              {data.popularReleases.map((r) => (
                <li key={r.id}>
                  <Link href={`/discover/release/${r.id}`} className="group flex items-center gap-3">
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-[#1a1a1a]">
                      <AppImage src={r.cover || FALLBACK_COVER} alt="" fill className="object-cover" sizes="48px" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-white group-hover:underline">{r.title}</p>
                      <p className="truncate text-[12px] text-white/45">{r.artist}</p>
                    </div>
                    <span className="shrink-0 text-[13px] tabular-nums text-white/60">{formatFcfa(r.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

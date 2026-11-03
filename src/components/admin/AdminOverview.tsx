import Link from "next/link";
import { Avatar } from "@heroui/react";
import {
  AnalyticsUpIcon,
  CreditCardIcon,
  Folder01Icon,
  Money01Icon,
  MusicNote01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { formatFcfa } from "@/lib/format";
import { PaymentStatusBadge } from "@/components/admin/PaymentStatusBadge";
import {
  ConsoleBars,
  ConsoleEmpty,
  ConsoleHeader,
  ConsoleLink,
  Delta,
  Initial,
  Kpi,
  KpiGrid,
  Panel,
  Pill,
  T,
} from "@/components/admin/console/ui";
import type { getAdminDashboard } from "@/lib/admin/queries";

type Dashboard = Awaited<ReturnType<typeof getAdminDashboard>>;

function RevenueSplit({ data }: { data: Dashboard }) {
  const mix = data.collectionMix;
  const segs = [
    { key: "a", label: "Versé aux artistes", pct: mix.artistNetPct, amount: mix.artistNet, color: "bg-violet-500" },
    { key: "c", label: "Commission", pct: mix.commissionPct, amount: mix.commission, color: "bg-violet-300" },
    { key: "s", label: "Abonnements", pct: mix.subscriptionsPct, amount: mix.subscriptions, color: "bg-zinc-500" },
  ];
  return (
    <div>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-white/[0.04]">
        {mix.total > 0
          ? segs.map((s) =>
              s.pct > 0 ? (
                <div key={s.key} className={s.color} style={{ width: `${s.pct}%` }} title={`${s.label} : ${formatFcfa(s.amount)}`} />
              ) : null,
            )
          : null}
      </div>
      <ul className="mt-4 space-y-2.5">
        {segs.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-2 text-zinc-400">
              <span className={`size-2 rounded-sm ${s.color}`} />
              {s.label}
            </span>
            <span className="tabular-nums text-zinc-100">
              {formatFcfa(s.amount)}
              <span className="ml-2 inline-block w-9 text-right text-[11px] text-zinc-500">{s.pct}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminOverview({ data }: { data: Dashboard }) {
  return (
    <div className="space-y-5">
      <ConsoleHeader
        kicker="Temps réel · 30 jours"
        title="Vue d'ensemble"
        description="L'état de la plateforme : argent qui entre, argent à reverser, activité."
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

      <KpiGrid cols={5}>
        <Kpi
          highlight
          label="Revenu plateforme"
          value={formatFcfa(data.platformRevenue30d)}
          delta={data.platformRevenueChangePct}
          sub="commission + abonnements"
          icon={AnalyticsUpIcon}
        />
        <Kpi label="Ventes musique" value={formatFcfa(data.musicGmv30d)} delta={data.musicGmvChangePct} sub="achats réglés" icon={MusicNote01Icon} />
        <Kpi label="Versé aux artistes" value={formatFcfa(data.artistNet30d)} delta={data.artistNetChangePct} sub="net crédité" icon={Wallet01Icon} />
        <Kpi label="Commission" value={formatFcfa(data.commission30d)} delta={data.commissionChangePct} sub="part Gootunes" icon={Money01Icon} />
        <Kpi label="Abonnements" value={formatFcfa(data.subscriptions30d)} delta={data.subscriptionsChangePct} sub="artistes + labels" icon={CreditCardIcon} />
      </KpiGrid>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Panel
          title="Activité des ventes"
          subtitle={`Musique + abonnements · ${formatFcfa(data.weekTotal)} sur 7 jours`}
          actions={<Pill tone="violet">7 jours</Pill>}
        >
          <ConsoleBars
            bars={data.salesByDay.map((d) => ({ key: d.key, label: d.label, value: d.amount }))}
            format={formatFcfa}
            height={220}
          />
        </Panel>

        <Panel
          title="File des retraits"
          subtitle="À verser aux créateurs"
          actions={
            data.pendingWithdrawalsCount > 0 ? (
              <Pill tone="warn" dot>
                {data.pendingWithdrawalsCount} en attente
              </Pill>
            ) : (
              <Pill tone="ok" dot>
                À jour
              </Pill>
            )
          }
          bodyClassName="flex flex-col"
        >
          <p className="text-[28px] font-semibold tabular-nums tracking-[-0.02em] text-white">
            {formatFcfa(data.pendingWithdrawalsFcfa)}
          </p>
          <div className="mt-4 flex-1 space-y-1.5">
            {data.pendingWithdrawals.length === 0 ? (
              <p className="rounded-lg bg-white/[0.02] px-3 py-3 text-[13px] text-zinc-500">
                Aucun retrait en attente.
              </p>
            ) : (
              data.pendingWithdrawals.map((w) => (
                <div key={w.id} className="flex items-center gap-3 rounded-lg bg-white/[0.025] px-3 py-2">
                  <Initial name={w.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-zinc-100">{w.name}</p>
                    <p className="text-[11px] text-zinc-500">{w.phone}</p>
                  </div>
                  <p className="shrink-0 text-[13px] font-semibold tabular-nums text-amber-200">
                    {formatFcfa(w.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="mt-4">
            <ConsoleLink href="/goo-admin/transactions" tone="primary">
              Traiter les retraits
            </ConsoleLink>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Panel
          flush
          title="Dernières transactions"
          subtitle="Achats de musique"
          actions={
            <ConsoleLink href="/goo-admin/transactions" size="sm">
              Tout voir
            </ConsoleLink>
          }
        >
          <div className={T.wrap}>
            <table className={`${T.table} min-w-[640px]`}>
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
                          {p.orderId ? ` · ${p.orderId}` : ""}
                        </p>
                      </td>
                      <td className={`${T.td} whitespace-nowrap text-zinc-400`}>
                        {new Date(p.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className={`${T.td} ${T.num} text-right`}>{formatFcfa(p.amount)}</td>
                      <td className={`${T.td} text-right tabular-nums text-violet-300`}>{formatFcfa(p.commission)}</td>
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

        <div className="space-y-4">
          <Panel title="Utilisateurs" actions={<Delta value={data.usersChangePct} />}>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[28px] font-semibold tabular-nums tracking-[-0.02em] text-white">
                  {data.usersTotal.toLocaleString("fr-FR")}
                </p>
                <p className="text-[12px] text-zinc-500">+{data.usersToday} aujourd&apos;hui</p>
              </div>
              <div className="flex -space-x-2">
                {data.recentUsers.slice(0, 5).map((u) => (
                  <Avatar key={u.id} className="size-8 ring-2 ring-[#111113]">
                    {u.avatar ? <Avatar.Image alt={u.name} src={u.avatar} /> : null}
                    <Avatar.Fallback>{u.name.slice(0, 1).toUpperCase()}</Avatar.Fallback>
                  </Avatar>
                ))}
              </div>
            </div>
            {data.openReports > 0 ? (
              <Link
                href="/goo-admin/signalements?status=open"
                className="mt-4 flex items-center justify-between rounded-lg bg-red-500/[0.07] px-3 py-2 text-[12px] text-red-200 ring-1 ring-red-500/15 transition hover:bg-red-500/10"
              >
                {data.openReports} signalement{data.openReports > 1 ? "s" : ""} à traiter
                <span aria-hidden>→</span>
              </Link>
            ) : null}
          </Panel>

          <Panel title="Répartition des encaissements" subtitle={formatFcfa(data.collectionMix.total)}>
            <RevenueSplit data={data} />
          </Panel>
        </div>
      </div>

      <Panel
        title="Publications récentes"
        actions={
          <ConsoleLink href="/goo-admin/morceaux" size="sm" icon={Folder01Icon}>
            Catalogue
          </ConsoleLink>
        }
      >
        {data.popularReleases.length === 0 ? (
          <ConsoleEmpty title="Aucune publication" />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {data.popularReleases.map((r) => (
              <Link
                key={r.id}
                href={`/discover/release/${r.id}`}
                className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-2 transition hover:border-white/10 hover:bg-white/[0.04]"
              >
                <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
                  {r.cover ? <AppImage src={r.cover} alt="" fill className="object-cover" sizes="44px" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-zinc-100">{r.title}</p>
                  <p className="truncate text-[11px] text-zinc-500">{r.artist}</p>
                </div>
                <span className="shrink-0 text-[12px] tabular-nums text-zinc-300">{formatFcfa(r.price)}</span>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

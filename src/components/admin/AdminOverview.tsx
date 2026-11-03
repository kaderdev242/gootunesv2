import { AppImage } from "@/components/media/AppImage";
import Link from "next/link";
import { Avatar } from "@heroui/react";
import { formatFcfa } from "@/lib/format";
import { PaymentStatusBadge } from "@/components/admin/PaymentStatusBadge";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { getAdminDashboard } from "@/lib/admin/queries";

type Dashboard = Awaited<ReturnType<typeof getAdminDashboard>>;

function Trend({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        up ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/10 text-red-600"
      }`}
    >
      {up ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
}

function FinanceCard({
  label,
  amount,
  change,
  tone,
  hint,
}: {
  label: string;
  amount: number;
  change: number;
  tone: "blue" | "green" | "violet" | "amber";
  hint: string;
}) {
  const tones = {
    blue: "bg-[#e8f1ff] text-[#1e4fbf]",
    green: "bg-[#e7f8ef] text-[#0f7a45]",
    violet: "bg-[#f0e9ff] text-[#6b3bc4]",
    amber: "bg-[#fff3e0] text-[#b86a00]",
  } as const;

  return (
    <div className={`rounded-[22px] p-4 sm:p-5 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] opacity-70">
          {label}
        </p>
        <Trend value={change} />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
        {formatFcfa(amount)}
      </p>
      <p className="mt-1.5 text-[11px] opacity-60">{hint}</p>
    </div>
  );
}

function BarChart({
  days,
  total,
}: {
  days: Dashboard["salesByDay"];
  total: number;
}) {
  const max = Math.max(...days.map((d) => d.amount), 1);
  const activeIdx = days.reduce(
    (best, d, i, arr) => (d.amount >= arr[best].amount ? i : best),
    0,
  );

  return (
    <div className="relative mt-4">
      <p className="text-sm text-zinc-500">
        Volume généré :{" "}
        <span className="font-semibold text-zinc-800">{formatFcfa(total)}</span>
      </p>
      <div className="relative mt-4 flex h-44 items-end justify-between gap-2 px-1 sm:h-52 sm:gap-3">
        {days.map((d, i) => {
          const h = Math.max(8, (d.amount / max) * 100);
          const active = i === activeIdx && d.amount > 0;
          return (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex h-28 w-full items-end justify-center sm:h-36">
                {active ? (
                  <span className="absolute -top-7 whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white">
                    {formatFcfa(d.amount)}
                  </span>
                ) : null}
                <div
                  className={`w-full max-w-[40px] rounded-t-xl transition ${
                    active
                      ? "bg-gradient-to-t from-[#3b6fd4] to-[#7ec8a3]"
                      : "bg-zinc-200/90"
                  }`}
                  style={{ height: `${h}%` }}
                  title={`${d.label}: ${formatFcfa(d.amount)}`}
                />
              </div>
              <span className="text-[10px] capitalize text-zinc-400">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CollectionBar({ mix }: { mix: Dashboard["collectionMix"] }) {
  const segments = [
    {
      key: "artist",
      label: "Verser artistes",
      pct: mix.artistNetPct,
      color: "bg-[#7ec8a3]",
      amount: mix.artistNet,
    },
    {
      key: "commission",
      label: "Commission",
      pct: mix.commissionPct,
      color: "bg-[#8b7cf6]",
      amount: mix.commission,
    },
    {
      key: "abo",
      label: "Abonnements",
      pct: mix.subscriptionsPct,
      color: "bg-[#5b8def]",
      amount: mix.subscriptions,
    },
  ];

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-zinc-400">
            Répartition 30 jours
          </p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            {formatFcfa(mix.total)}
          </p>
        </div>
        <p className="text-[11px] text-zinc-400">Net + commission + abos</p>
      </div>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-zinc-100">
        {segments.map((s) =>
          s.pct > 0 ? (
            <div
              key={s.key}
              className={`${s.color} transition`}
              style={{ width: `${s.pct}%` }}
              title={`${s.label}: ${formatFcfa(s.amount)}`}
            />
          ) : null,
        )}
      </div>
      <ul className="mt-4 space-y-2.5">
        {segments.map((s) => (
          <li
            key={s.key}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2 text-zinc-600">
              <span className={`size-2.5 rounded-full ${s.color}`} />
              {s.label}
            </span>
            <span className="font-medium text-zinc-800">
              {formatFcfa(s.amount)}
              <span className="ml-1.5 text-[11px] font-normal text-zinc-400">
                {s.pct}%
              </span>
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
      <AdminPageHeader
        title="Vue d'ensemble"
        description="Finances et activité Gootunes — 30 derniers jours"
        action={{ href: "/goo-admin/stats", label: "Voir les stats" }}
      />

      {/* 4 flux financiers séparés */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceCard
          label="Revenus musique"
          amount={data.musicGmv30d}
          change={data.musicGmvChangePct}
          tone="blue"
          hint="GMV achats completed"
        />
        <FinanceCard
          label="Verser aux artistes"
          amount={data.artistNet30d}
          change={data.artistNetChangePct}
          tone="green"
          hint="Net crédité aux créateurs"
        />
        <FinanceCard
          label="Commission"
          amount={data.commission30d}
          change={data.commissionChangePct}
          tone="violet"
          hint="Part plateforme sur ventes"
        />
        <FinanceCard
          label="Abonnements"
          amount={data.subscriptions30d}
          change={data.subscriptionsChangePct}
          tone="amber"
          hint="Plans artiste + label"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="space-y-4">
          <section className="rounded-[24px] border border-zinc-200/70 bg-white p-5 shadow-sm shadow-zinc-900/[0.03] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Activité des ventes
                </h2>
                <p className="text-xs text-zinc-400">
                  Musique + abonnements · 7 jours
                </p>
              </div>
              <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-xs font-semibold text-[#3b6fd4]">
                Cette semaine
              </span>
            </div>
            <BarChart days={data.salesByDay} total={data.weekTotal} />
          </section>

          <section className="overflow-hidden rounded-[24px] border border-zinc-200/70 bg-white shadow-sm shadow-zinc-900/[0.03]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-zinc-900">
                Dernières transactions
              </h2>
              <Link
                href="/goo-admin/transactions"
                className="text-xs font-semibold text-[#3b6fd4] hover:underline"
              >
                Tout voir
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-[11px] uppercase tracking-wider text-zinc-400">
                    <th className="px-5 py-3 font-medium sm:px-6">Produit</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Montant</th>
                    <th className="px-3 py-3 font-medium">Commission</th>
                    <th className="px-5 py-3 font-medium sm:px-6">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentPurchases.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-8 text-center text-sm text-zinc-400 sm:px-6"
                      >
                        Aucune transaction récente.
                      </td>
                    </tr>
                  ) : (
                    data.recentPurchases.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-zinc-50 last:border-0"
                      >
                        <td className="px-5 py-3.5 sm:px-6">
                          <p className="font-medium text-zinc-900">{p.title}</p>
                          <p className="text-[11px] text-zinc-400">
                            {p.buyer}
                            {p.orderId ? ` · ${p.orderId}` : ""}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-zinc-500">
                          {new Date(p.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 font-medium text-zinc-800">
                          {formatFcfa(p.amount)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-zinc-500">
                          {formatFcfa(p.commission)}
                        </td>
                        <td className="px-5 py-3.5 sm:px-6">
                          <PaymentStatusBadge status={p.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-[24px] border border-zinc-200/70 bg-white p-5 shadow-sm shadow-zinc-900/[0.03]">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">
                Retraits en attente
              </h2>
              {data.pendingWithdrawalsCount > 0 ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {data.pendingWithdrawalsCount}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">
              {formatFcfa(data.pendingWithdrawalsFcfa)}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              À verser aux artistes / labels
            </p>
            <div className="mt-4 space-y-2.5">
              {data.pendingWithdrawals.length === 0 ? (
                <p className="text-sm text-zinc-400">Aucun retrait en attente.</p>
              ) : (
                data.pendingWithdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[#f4f5f7] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-800">
                        {w.name}
                      </p>
                      <p className="text-[11px] text-zinc-400">{w.phone}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-zinc-900">
                      {formatFcfa(w.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
            <Link
              href="/goo-admin/transactions"
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#5b8def] py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#5b8def]/25 transition hover:bg-[#4a7de0]"
            >
              Gérer les retraits
            </Link>
          </section>

          <section className="rounded-[24px] border border-zinc-200/70 bg-white p-5 shadow-sm shadow-zinc-900/[0.03]">
            <CollectionBar mix={data.collectionMix} />
          </section>

          <section className="rounded-[24px] border border-zinc-200/70 bg-white p-5 shadow-sm shadow-zinc-900/[0.03]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">
                Revenu plateforme
              </h2>
              <Trend value={data.platformRevenueChangePct} />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
              {formatFcfa(data.platformRevenue30d)}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Commission + abonnements · 30 j
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[#f0e9ff] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b3bc4]/70">
                  Commission
                </p>
                <p className="mt-1 text-sm font-semibold text-[#6b3bc4]">
                  {formatFcfa(data.commission30d)}
                </p>
              </div>
              <div className="rounded-xl bg-[#fff3e0] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#b86a00]/70">
                  Abonnements
                </p>
                <p className="mt-1 text-sm font-semibold text-[#b86a00]">
                  {formatFcfa(data.subscriptions30d)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-zinc-200/70 bg-white p-5 shadow-sm shadow-zinc-900/[0.03]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">
                Utilisateurs
              </h2>
              <Trend value={data.usersChangePct} />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
              {data.usersTotal.toLocaleString("fr-FR")}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {data.usersToday} nouveau{data.usersToday > 1 ? "x" : ""}{" "}
              aujourd&apos;hui
              {data.openReports > 0
                ? ` · ${data.openReports} signalement${data.openReports > 1 ? "s" : ""} ouvert${data.openReports > 1 ? "s" : ""}`
                : ""}
            </p>
            <div className="mt-4 flex -space-x-2">
              {data.recentUsers.slice(0, 6).map((u) => (
                <Avatar key={u.id} className="size-8 ring-2 ring-white">
                  {u.avatar ? (
                    <Avatar.Image alt={u.name} src={u.avatar} />
                  ) : null}
                  <Avatar.Fallback>
                    {u.name.slice(0, 1).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-zinc-200/70 bg-white p-5 shadow-sm shadow-zinc-900/[0.03]">
            <h2 className="text-lg font-semibold text-zinc-900">
              Publications récentes
            </h2>
            <div className="mt-4 space-y-3">
              {data.popularReleases.length === 0 ? (
                <p className="text-sm text-zinc-400">Aucune publication.</p>
              ) : (
                data.popularReleases.map((r) => (
                  <Link
                    key={r.id}
                    href={`/discover/release/${r.id}`}
                    className="flex items-center gap-3 rounded-xl p-1 transition hover:bg-zinc-50"
                  >
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                      {r.cover ? (
                        <AppImage
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
                        {r.artist} · {formatFcfa(r.price)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

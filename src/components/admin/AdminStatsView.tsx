import { Calendar03Icon, Money01Icon } from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { formatFcfa, formatCount } from "@/lib/format";
import { isCountryCode } from "@/lib/geo";
import { CountryFlag } from "@/components/auth/CountryFlag";
import {
  ConsoleEmpty,
  ConsoleHeader,
  ConsoleLink,
  Kpi,
  KpiGrid,
  Panel,
  Pill,
} from "@/components/admin/console/ui";
import type { getAdminAnalytics } from "@/lib/admin/queries";

type Analytics = Awaited<ReturnType<typeof getAdminAnalytics>>;

function PeriodKpi({ title, data, highlight }: { title: string; data: Analytics["periods"]["day"]; highlight?: boolean }) {
  return (
    <Kpi
      highlight={highlight}
      label={title}
      value={formatFcfa(data.totalAmount)}
      icon={Calendar03Icon}
      sub={`${data.totalCount} vente${data.totalCount > 1 ? "s" : ""} · morceaux ${formatFcfa(data.musicAmount)} · abos ${formatFcfa(data.labelAmount)}`}
    />
  );
}

function CountryBars({
  rows,
  mode,
}: {
  rows: { country: string; label: string; count: number; amount?: number }[];
  mode: "users" | "buyers";
}) {
  const max = Math.max(...rows.map((r) => (mode === "buyers" ? r.amount || 0 : r.count)), 1);
  if (!rows.length) return <ConsoleEmpty title="Pas encore de données" />;

  return (
    <ol className="space-y-3">
      {rows.slice(0, 7).map((row, i) => {
        const value = mode === "buyers" ? row.amount || 0 : row.count;
        return (
          <li key={row.country} className="grid grid-cols-[18px_1fr] items-center gap-3">
            <span className="text-[11px] tabular-nums text-zinc-600">{i + 1}</span>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[13px]">
                <span className="flex items-center gap-2 text-zinc-100">
                  {row.country !== "—" && isCountryCode(row.country) ? (
                    <CountryFlag code={row.country} className="h-3 w-[18px] rounded-[2px]" />
                  ) : null}
                  {row.label}
                </span>
                <span className="text-[12px] tabular-nums text-zinc-400">
                  {mode === "buyers" ? `${row.count} · ${formatFcfa(row.amount || 0)}` : `${row.count} comptes`}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className={`h-full rounded-full ${mode === "buyers" ? "bg-gradient-to-r from-violet-600 to-violet-300" : "bg-zinc-400"}`}
                  style={{ width: `${Math.max(4, (value / max) * 100)}%` }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function AdminStatsView({ data }: { data: Analytics }) {
  const maxDay = Math.max(...data.dailySales.map((d) => d.total), 1);
  const totalMix = data.productMix.musicAmount + data.productMix.labelAmount;
  const musicShare = totalMix > 0 ? Math.round((data.productMix.musicAmount / totalMix) * 100) : 0;

  return (
    <div className="space-y-5">
      <ConsoleHeader
        kicker="Pilotage"
        title="Statistiques"
        description="D'où viennent les utilisateurs, qui achète, et quoi."
        actions={<ConsoleLink href="/goo-admin">Vue d&apos;ensemble</ConsoleLink>}
      />

      <KpiGrid cols={4}>
        <PeriodKpi title="Aujourd'hui" data={data.periods.day} highlight />
        <PeriodKpi title="7 derniers jours" data={data.periods.week} />
        <PeriodKpi title="30 derniers jours" data={data.periods.month} />
        <Kpi label="Commission (30 j)" value={formatFcfa(data.totals.commissionMonth)} icon={Money01Icon} sub="part Gootunes" />
      </KpiGrid>

      <Panel
        title="Ventes journalières"
        subtitle="Morceaux et abonnements, empilés"
        actions={
          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-violet-500" /> Morceaux
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-zinc-500" /> Abonnements
            </span>
          </div>
        }
      >
        <div className="relative h-56">
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="border-t border-dashed border-white/[0.05]" />
            ))}
          </div>
          <div className="relative flex h-full items-end gap-1 sm:gap-1.5">
            {data.dailySales.map((d) => {
              const pct = d.total > 0 ? Math.max(6, (d.total / maxDay) * 100) : 2;
              return (
                <div
                  key={d.key}
                  className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                  title={`${d.dayLabel} : ${formatFcfa(d.total)} (morceaux ${formatFcfa(d.music)} · abos ${formatFcfa(d.subscriptions)})`}
                >
                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      className="flex w-full max-w-[22px] flex-col justify-end overflow-hidden rounded-t-[4px] transition group-hover:brightness-125"
                      style={{ height: `${pct}%` }}
                    >
                      {d.subscriptions > 0 ? <div className="w-full bg-zinc-500" style={{ flex: d.subscriptions }} /> : null}
                      {d.music > 0 ? <div className="w-full bg-violet-500" style={{ flex: d.music }} /> : null}
                      {d.total === 0 ? <div className="h-full w-full bg-white/[0.06]" /> : null}
                    </div>
                  </div>
                  <span className="text-[9px] text-zinc-500 sm:text-[10px]">{d.dayLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Origine des utilisateurs"
          subtitle={`Pays du profil · ${data.totals.users} comptes`}
        >
          <CountryBars rows={data.usersByCountry} mode="users" />
          <div className="mt-5 flex flex-wrap gap-1.5 border-t border-white/[0.05] pt-4">
            <Pill>{data.totals.fans} fans</Pill>
            <Pill>{data.totals.artists} artistes</Pill>
            <Pill>{data.totals.labels} labels</Pill>
            <Pill tone="violet">{formatCount(data.totals.plays)} écoutes</Pill>
          </div>
        </Panel>

        <Panel title="Pays qui achètent" subtitle="Achats réglés, par pays de l'acheteur">
          <CountryBars rows={data.buyersByCountry} mode="buyers" />
        </Panel>

        <Panel title="Ce qui se vend" subtitle="Morceaux vs abonnements label (historique)">
          <div className="space-y-5">
            <div>
              <div className="mb-1.5 flex justify-between text-[13px]">
                <span className="text-zinc-100">Morceaux</span>
                <span className="tabular-nums text-zinc-400">
                  {data.productMix.musicCount} · {formatFcfa(data.productMix.musicAmount)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                <div className="h-full rounded-full bg-violet-500" style={{ width: `${musicShare}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-[13px]">
                <span className="text-zinc-100">Abonnements label</span>
                <span className="tabular-nums text-zinc-400">
                  {data.productMix.labelCount} · {formatFcfa(data.productMix.labelAmount)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                <div className="h-full rounded-full bg-zinc-500" style={{ width: `${100 - musicShare}%` }} />
              </div>
              <div className="mt-2.5 flex gap-1.5">
                <Pill>Starter {data.productMix.labelPlans.starter}</Pill>
                <Pill>Unlimited {data.productMix.labelPlans.unlimited}</Pill>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-violet-500/[0.08] px-4 py-3 ring-1 ring-violet-400/15">
              <span className="text-[12px] text-violet-200/80">Part des morceaux</span>
              <span className="text-[22px] font-semibold tabular-nums text-white">{musicShare}%</span>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Meilleures ventes" subtitle="Classement des sorties" actions={<Pill tone="violet">Top {data.topReleases.length}</Pill>}>
        {data.topReleases.length === 0 ? (
          <ConsoleEmpty title="Aucune vente pour le moment" />
        ) : (
          <ol className="grid gap-2 md:grid-cols-2">
            {data.topReleases.map((r, i) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
              >
                <span className={`w-6 text-center text-[13px] font-semibold tabular-nums ${i < 3 ? "text-violet-300" : "text-zinc-600"}`}>
                  {i + 1}
                </span>
                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
                  {r.cover ? <AppImage src={r.cover} alt="" fill className="object-cover" sizes="40px" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-zinc-100">{r.title}</p>
                  <p className="text-[11px] capitalize text-zinc-500">
                    {r.type} · {r.count} vente{r.count > 1 ? "s" : ""}
                  </p>
                </div>
                <p className="text-[13px] font-semibold tabular-nums text-violet-200">{formatFcfa(r.amount)}</p>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}

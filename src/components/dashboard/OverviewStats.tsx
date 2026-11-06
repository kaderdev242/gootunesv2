import Link from "next/link";
import { AnalyticsUpIcon } from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { formatMoney, formatCount } from "@/lib/format";
import { FALLBACK_COVER } from "@/lib/types/music";
import { changePct, type CreatorOverview } from "@/lib/dashboard/overview";
import type { CreatorBase } from "@/lib/dashboard/paths";
import {
  ConsoleEmpty,
  ConsoleHeader,
  ConsoleLink,
  Kpi,
  KpiGrid,
  Panel,
  RankBar,
  T,
} from "@/components/admin/console/ui";
import { LineChart } from "@/components/admin/console/LineChart";

export function OverviewStats({
  name,
  basePath = "/artist",
  balance,
  country,
  data,
}: {
  name: string;
  basePath?: CreatorBase;
  balance: number;
  country?: string | null;
  data: CreatorOverview;
}) {
  const money = (n: number) => formatMoney(n, country);
  const period = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const topMax = Math.max(...data.topReleases.map((r) => r.net), 1);
  const releasePath = (id: string | null, fallback: string) => `/discover/release/${id || fallback}`;

  return (
    <div className="space-y-6">
      <ConsoleHeader
        title="Vue d'ensemble"
        description={`${name} · ${period}`}
        actions={
          <ConsoleLink href={`${basePath}/statistiques`} icon={AnalyticsUpIcon}>
            Statistiques
          </ConsoleLink>
        }
      />

      <KpiGrid cols={4}>
        <Kpi highlight label="Solde disponible" value={money(balance)} sub="retirable en Mobile Money" />
        <Kpi label="Revenus nets, 30 jours" value={money(data.net30)} delta={changePct(data.net30, data.netPrev30)} sub="aucune vente le mois précédent" />
        <Kpi label="Ventes, 30 jours" value={formatCount(data.sales30)} delta={changePct(data.sales30, data.salesPrev30)} sub={`${data.releasesCount} sortie${data.releasesCount > 1 ? "s" : ""} au catalogue`} />
        <Kpi label="Écoutes, 30 jours" value={formatCount(data.plays30)} delta={changePct(data.plays30, data.playsPrev30)} sub="sur Discover et l'appli" />
      </KpiGrid>

      <div className="grid gap-4 xl:grid-cols-[1.9fr_1fr]">
        <Panel title="Revenus nets" subtitle={`30 derniers jours · ${money(data.net30)}`}>
          <LineChart points={data.series} country={country} height={280} />
        </Panel>

        <Panel
          title="Titres les plus vendus"
          subtitle="Depuis ta première sortie"
          actions={
            <Link href={`${basePath}/publications`} className="text-[13px] text-white/50 transition-colors hover:text-white">
              Tout voir
            </Link>
          }
        >
          {data.topReleases.length === 0 ? (
            <ConsoleEmpty title="Pas encore de vente" hint="Tes meilleures sorties apparaîtront ici" />
          ) : (
            <ol className="space-y-4">
              {data.topReleases.map((r, i) => (
                <li key={r.releaseId}>
                  <Link href={releasePath(r.publicId, r.releaseId)} className="group flex items-center gap-3">
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-[#1a1a1a]">
                      <AppImage src={r.cover || FALLBACK_COVER} alt="" fill className="object-cover" sizes="48px" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-[14px] font-medium text-white group-hover:underline">{r.title}</p>
                        <p className="shrink-0 text-[14px] tabular-nums text-white">{money(r.net)}</p>
                      </div>
                      <p className="text-[12px] text-white/45">
                        {r.sales} vente{r.sales > 1 ? "s" : ""}
                      </p>
                      <RankBar value={r.net} max={topMax} lead={i === 0} />
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.9fr_1fr]">
        <Panel flush title="Dernières ventes" subtitle="Ce que tu as touché sur chaque achat">
          {data.recentSales.length === 0 ? (
            <ConsoleEmpty title="Aucune vente pour l'instant" hint="Publie un single ou un album pour commencer" />
          ) : (
            <div className={T.wrap}>
              <table className={`${T.table} min-w-[520px]`}>
                <thead className={T.thead}>
                  <tr>
                    <th className={T.th}>Sortie</th>
                    <th className={T.th}>Date</th>
                    <th className={T.th}>Paiement</th>
                    <th className={`${T.th} text-right`}>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSales.map((s, i) => (
                    <tr key={`${s.createdAt}-${i}`} className={T.tr}>
                      <td className={T.td}>
                        <div className="flex items-center gap-3">
                          <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-[#1a1a1a]">
                            <AppImage src={s.cover || FALLBACK_COVER} alt="" fill className="object-cover" sizes="36px" />
                          </span>
                          <span className={`${T.strong} truncate`}>{s.title}</span>
                        </div>
                      </td>
                      <td className={`${T.td} whitespace-nowrap text-white/50`}>
                        {new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </td>
                      <td className={`${T.td} text-white/50`}>{s.apple ? "iOS" : "Mobile Money"}</td>
                      <td className={`${T.td} ${T.num} text-right`}>+{money(s.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Comment tu es payé" subtitle={`${money(data.totalNet)} gagnés au total`}>
          <ul className="space-y-4">
            <li>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[14px] text-white">Mobile Money</p>
                <p className="text-[14px] tabular-nums text-white">{money(data.momoNet)}</p>
              </div>
              <p className="text-[12px] text-white/45">Tu gardes 80 % du prix</p>
              <RankBar value={data.momoNet} max={Math.max(data.totalNet, 1)} lead />
            </li>
            <li>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[14px] text-white">Achats iOS</p>
                <p className="text-[14px] tabular-nums text-white">{money(data.appleNet)}</p>
              </div>
              <p className="text-[12px] text-white/45">Tu gardes 70 % du prix</p>
              <RankBar value={data.appleNet} max={Math.max(data.totalNet, 1)} />
            </li>
          </ul>
          <div className="mt-6">
            <ConsoleLink href={`${basePath}/retraits`} tone="primary" size="sm">
              Retirer mon solde
            </ConsoleLink>
          </div>
        </Panel>
      </div>
    </div>
  );
}

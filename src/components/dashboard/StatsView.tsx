import type { ReactNode } from "react";
import { AppImage } from "@/components/media/AppImage";
import Link from "next/link";
import { Avatar } from "@heroui/react";
import { formatMoney } from "@/lib/format";
import { isCountryCode } from "@/lib/geo";
import { CountryFlag } from "@/components/auth/CountryFlag";
import type { CreatorStats } from "@/lib/stats/creator-stats";

export function StatsView({
  stats,
  showByArtist = false,
  title = "Statistiques",
  subtitle = "Ventes, pays d'achat et écoutes de tes morceaux.",
  headerSlot,
  country,
}: {
  stats: CreatorStats;
  showByArtist?: boolean;
  title?: string;
  subtitle?: string;
  headerSlot?: ReactNode;
  country?: string | null;
}) {
  const maxCountry = Math.max(...stats.byCountry.map((c) => c.purchases), 1);
  const maxArtistNet = Math.max(...stats.byArtist.map((a) => a.netFcfa), 1);
  const money = (n: number) => formatMoney(n, country);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      {headerSlot ?? (
        <header>
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-white/45">{subtitle}</p>
        </header>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Ventes", value: String(stats.totalSales) },
          { label: "CA brut", value: money(stats.totalGross) },
          { label: "Net artiste", value: money(stats.totalNet) },
          { label: "Écoutes", value: String(stats.totalPlays) },
          { label: "Auditeurs uniques", value: String(stats.uniqueListeners) },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-xs text-white/45">{card.label}</p>
            <p className="font-display mt-2 text-xl font-bold text-white sm:text-2xl">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Morceaux / publications les plus vendus</h2>
          <div className="mt-4 flex flex-col gap-2">
            {stats.topSales.length === 0 ? (
              <p className="text-sm text-white/40">Aucune vente pour le moment.</p>
            ) : (
              stats.topSales.map((row, i) => (
                <div
                  key={row.releaseId}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
                >
                  <span className="w-6 text-sm text-white/35">{i + 1}</span>
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-zinc-900">
                    {row.coverUrl ? (
                      <AppImage
                        src={row.coverUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {row.title}
                    </p>
                    <p className="text-xs text-white/40">
                      {row.salesCount} vente{row.salesCount > 1 ? "s" : ""} ·{" "}
                      {money(row.grossFcfa)}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-emerald-300">
                    {money(row.netFcfa)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Pays des achats</h2>
          <div className="mt-4 flex flex-col gap-3">
            {stats.byCountry.length === 0 ? (
              <p className="text-sm text-white/40">Aucun pays enregistré.</p>
            ) : (
              stats.byCountry.map((row) => (
                <div key={row.country}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-white">
                      {isCountryCode(row.country) ? (
                        <CountryFlag code={row.country} title={row.label} />
                      ) : null}
                      {row.label}
                    </span>
                    <span className="text-white/45">
                      {row.purchases} · {money(row.amountFcfa)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-white/45"
                      style={{
                        width: `${Math.max(6, (row.purchases / maxCountry) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {showByArtist ? (
        <section className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Revenus par artiste</h2>
          <p className="mt-1 text-xs text-white/40">
            Répartition des ventes nettes sur les artistes du label.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {stats.byArtist.length === 0 ? (
              <p className="text-sm text-white/40">
                Aucun revenu artiste pour le moment.
              </p>
            ) : (
              stats.byArtist.map((row) => (
                <Link
                  key={row.artistId}
                  href={`/label/artistes/${row.artistId}`}
                  className="block rounded-2xl transition hover:bg-white/[0.03]"
                >
                  <div className="mb-1.5 flex items-center gap-3">
                    <Avatar className="size-9 shrink-0 ring-1 ring-white/10">
                      {row.avatarUrl ? (
                        <Avatar.Image src={row.avatarUrl} alt={row.stageName} />
                      ) : null}
                      <Avatar.Fallback>
                        {row.stageName.slice(0, 1).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium text-white">
                          {row.stageName}
                        </span>
                        <span className="shrink-0 text-emerald-300">
                          {money(row.netFcfa)}
                        </span>
                      </div>
                      <p className="text-xs text-white/40">
                        {row.salesCount} vente{row.salesCount > 1 ? "s" : ""} ·{" "}
                        {money(row.grossFcfa)} brut
                      </p>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-white/45"
                      style={{
                        width: `${Math.max(6, (row.netFcfa / maxArtistNet) * 100)}%`,
                      }}
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      ) : null}

      <section className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Écoutes par morceau</h2>
        <p className="mt-1 text-xs text-white/40">
          Nombre de lectures et auditeurs uniques sur tes titres.
        </p>
        <div className="mt-4 overflow-x-auto">
          {stats.topTracks.length === 0 ? (
            <p className="text-sm text-white/40">
              Aucune écoute enregistrée pour l&apos;instant.
            </p>
          ) : (
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-xs text-white/40">
                <tr>
                  <th className="pb-2 font-medium">Morceau</th>
                  <th className="pb-2 font-medium">Publication</th>
                  <th className="pb-2 font-medium">Écoutes</th>
                  <th className="pb-2 font-medium">Auditeurs</th>
                </tr>
              </thead>
              <tbody>
                {stats.topTracks.map((row) => (
                  <tr
                    key={row.trackId}
                    className="border-t border-white/8 text-white/80"
                  >
                    <td className="py-3 pr-3 font-medium text-white">
                      {row.title}
                    </td>
                    <td className="py-3 pr-3 text-white/50">{row.releaseTitle}</td>
                    <td className="py-3 pr-3">{row.plays}</td>
                    <td className="py-3">{row.uniqueListeners}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

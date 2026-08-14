import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@heroui/react";
import { formatFcfa } from "@/lib/format";
import { isCountryCode } from "@/lib/geo";
import { CountryFlag } from "@/components/auth/CountryFlag";
import type { getAdminDashboard } from "@/lib/admin/queries";

type Dashboard = Awaited<ReturnType<typeof getAdminDashboard>>;

function Trend({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      {up ? "↑" : "↓"} {Math.abs(value)}%
    </span>
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
    <div className="relative mt-6">
      <p className="pointer-events-none absolute inset-x-0 top-2 text-center text-5xl font-semibold tracking-tight text-zinc-100 sm:text-6xl">
        {formatFcfa(total).replace(/\s/g, "\u00a0")}
      </p>
      <div className="relative flex h-44 items-end justify-between gap-2 px-1 pt-10 sm:h-52 sm:gap-3">
        {days.map((d, i) => {
          const h = Math.max(8, (d.amount / max) * 100);
          const active = i === activeIdx && d.amount > 0;
          return (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex h-28 w-full items-end justify-center sm:h-36">
                {active ? (
                  <span className="absolute -top-7 rounded-lg bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white">
                    {formatFcfa(d.amount)}
                  </span>
                ) : null}
                <div
                  className={`w-full max-w-[36px] rounded-t-xl transition ${
                    active
                      ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                      : "bg-zinc-200"
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

export function AdminOverview({ data }: { data: Dashboard }) {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Vue d&apos;ensemble
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Activité récente de Gootunes
          </p>
        </div>
        <Link
          href="/goo-admin/stats"
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Voir les stats
        </Link>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-4">
          {/* Overview card */}
          <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-900">Aperçu</h2>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">
                30 derniers jours
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
                <p className="text-xs font-medium text-zinc-400">Utilisateurs</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
                  {data.usersTotal.toLocaleString("fr-FR")}
                </p>
                <div className="mt-2">
                  <Trend value={data.usersChangePct} />
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
                <p className="text-xs font-medium text-zinc-400">
                  Volume (GMV)
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
                  {formatFcfa(data.gmv30d)}
                </p>
                <div className="mt-2">
                  <Trend value={data.gmvChangePct} />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-zinc-800">
                {data.usersToday} nouvel{data.usersToday > 1 ? "les" : ""}{" "}
                utilisateur{data.usersToday > 1 ? "s" : ""} aujourd&apos;hui
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {data.recentUsers.slice(0, 6).map((u) => (
                  <div key={u.id} className="flex w-14 flex-col items-center gap-1">
                    <Avatar className="size-10">
                      {u.avatar ? (
                        <Avatar.Image alt={u.name} src={u.avatar} />
                      ) : null}
                      <Avatar.Fallback>
                        {u.name.slice(0, 1).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar>
                    <span className="w-full truncate text-center text-[10px] text-zinc-500">
                      {u.name.split(" ")[0]}
                    </span>
                  </div>
                ))}
                <Link
                  href="/goo-admin/fans"
                  className="ml-auto rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
                >
                  Voir tout
                </Link>
              </div>
            </div>
          </section>

          {/* Chart card */}
          <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-900">
                Ventes (7 jours)
              </h2>
              <span className="text-xs text-zinc-400">
                Morceaux + abonnements label
              </span>
            </div>
            <BarChart days={data.salesByDay} total={data.weekTotal} />
          </section>
        </div>

        <div className="space-y-4">
          {/* Popular */}
          <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/5">
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
                    className="flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-zinc-50"
                  >
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                      {r.cover ? (
                        <Image
                          src={r.cover}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
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
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                      {r.type === "album" ? "Album" : "Single"}
                    </span>
                  </Link>
                ))
              )}
            </div>
            <Link
              href="/goo-admin/morceaux"
              className="mt-4 flex w-full items-center justify-center rounded-2xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
            >
              Tous les morceaux
            </Link>
          </section>

          {/* Reports activity */}
          <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">
                Signalements
              </h2>
              {data.openReports > 0 ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {data.openReports} ouverts
                </span>
              ) : null}
            </div>
            <div className="mt-4 space-y-4">
              {data.recentReports.length === 0 ? (
                <p className="text-sm text-zinc-400">Aucun signalement récent.</p>
              ) : (
                data.recentReports.map((r) => (
                  <div key={r.id} className="flex gap-3">
                    <Avatar className="size-9 shrink-0">
                      {r.reporterAvatar ? (
                        <Avatar.Image
                          alt={r.reporterName}
                          src={r.reporterAvatar}
                        />
                      ) : null}
                      <Avatar.Fallback>
                        {r.reporterName.slice(0, 1).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-800">
                        <span className="font-medium">{r.reporterName}</span>{" "}
                        <span className="text-zinc-400">sur</span>{" "}
                        <span className="font-medium">{r.trackTitle}</span>
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                        {r.details || r.reason}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        {new Date(r.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link
              href="/goo-admin/signalements"
              className="mt-4 flex w-full items-center justify-center rounded-2xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
            >
              Voir les signalements
            </Link>
          </section>

          {/* Quick countries from recent users */}
          <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/5">
            <h2 className="text-sm font-semibold text-zinc-900">
              Derniers inscrits
            </h2>
            <div className="mt-3 space-y-2">
              {data.recentUsers.slice(0, 4).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-2 text-sm text-zinc-600"
                >
                  {u.country && isCountryCode(u.country) ? (
                    <CountryFlag code={u.country} className="h-3.5 w-5" />
                  ) : (
                    <span className="inline-block h-3.5 w-5 rounded-sm bg-zinc-200" />
                  )}
                  <span className="truncate font-medium text-zinc-800">
                    {u.name}
                  </span>
                  <span className="ml-auto text-xs text-zinc-400">
                    {u.countryLabel}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

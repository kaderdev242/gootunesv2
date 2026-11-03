"use client";

import { useMemo, useState } from "react";
import { PaymentStatusBadge } from "@/components/admin/PaymentStatusBadge";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatFcfa } from "@/lib/format";
import type {
  AdminSubscriptionRevenue,
  AdminSubscriptionRow,
  SubscriptionKind,
} from "@/lib/admin/queries";

const KIND_LABELS: Record<SubscriptionKind | "all", string> = {
  all: "Tous",
  artist_plan: "Artistes",
  label_plan: "Labels",
};

const STATUS_LABELS: Record<string, string> = {
  all: "Tous",
  completed: "Réussi",
  pending: "Attente",
  failed: "Échec",
  cancelled: "Annulé",
};

type SortKey = "date" | "amount" | "plan" | "party" | "kind";

export function AdminSubscriptionsView({
  data,
}: {
  data: AdminSubscriptionRevenue;
}) {
  const { rows, totals } = data;
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<SubscriptionKind | "all">("all");
  const [status, setStatus] = useState<string>("completed");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((row) => {
      if (kind !== "all" && row.kind !== kind) return false;
      if (status !== "all" && row.status !== status) return false;
      if (!q) return true;
      const hay = [
        row.party,
        row.partyEmail,
        row.plan,
        row.method,
        row.orderId,
        row.phone,
        KIND_LABELS[row.kind],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "amount":
          cmp = a.amountFcfa - b.amountFcfa;
          break;
        case "plan":
          cmp = a.plan.localeCompare(b.plan, "fr");
          break;
        case "party":
          cmp = a.party.localeCompare(b.party, "fr");
          break;
        case "kind":
          cmp = a.kind.localeCompare(b.kind);
          break;
        case "date":
        default:
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return cmp * dir;
    });
    return list;
  }, [kind, query, rows, sortDir, sortKey, status]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "party" || key === "plan" ? "asc" : "desc");
    }
  }

  function sortLabel(key: SortKey, label: string) {
    if (sortKey !== key) return label;
    return `${label} ${sortDir === "asc" ? "↑" : "↓"}`;
  }

  const counts = useMemo(() => {
    const byKind: Record<string, number> = {
      all: rows.length,
      artist_plan: 0,
      label_plan: 0,
    };
    for (const row of rows) {
      byKind[row.kind] = (byKind[row.kind] || 0) + 1;
    }
    return byKind;
  }, [rows]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Abonnements"
        description="Revenus plans artistes et labels — séparés des ventes musique et commissions."
        action={{ href: "/goo-admin/transactions", label: "Transactions" }}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total abonnements"
          value={formatFcfa(totals.allCompletedFcfa)}
          hint="Commandes réussies"
          tone="amber"
        />
        <StatCard
          label="Artistes"
          value={formatFcfa(totals.artistCompletedFcfa)}
          hint={`${totals.artistCount} abo${totals.artistCount > 1 ? "s" : ""}`}
          tone="blue"
        />
        <StatCard
          label="Labels"
          value={formatFcfa(totals.labelCompletedFcfa)}
          hint={`${totals.labelCount} abo${totals.labelCount > 1 ? "s" : ""}`}
          tone="violet"
        />
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher (compte, plan, commande…)"
          className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none ring-zinc-900/10 placeholder:text-zinc-400 focus:ring-2"
        />

        <div className="flex flex-wrap gap-1.5">
          {(["all", "artist_plan", "label_plan"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setKind(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                kind === id
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
              }`}
            >
              {KIND_LABELS[id]}
              <span className="ml-1 opacity-60">{counts[id] || 0}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            ["all", "completed", "pending", "failed", "cancelled"] as const
          ).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatus(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                status === id
                  ? "bg-white text-zinc-900 ring-2 ring-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {STATUS_LABELS[id]}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-400">
        {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
        {query.trim() ? ` pour « ${query.trim()} »` : ""}
      </p>

      <div className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-sm shadow-zinc-900/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs text-zinc-400">
              <tr>
                <SortTh onClick={() => toggleSort("date")}>
                  {sortLabel("date", "Date")}
                </SortTh>
                <SortTh onClick={() => toggleSort("kind")}>
                  {sortLabel("kind", "Type")}
                </SortTh>
                <SortTh onClick={() => toggleSort("plan")}>
                  {sortLabel("plan", "Plan")}
                </SortTh>
                <SortTh onClick={() => toggleSort("party")}>
                  {sortLabel("party", "Compte")}
                </SortTh>
                <SortTh onClick={() => toggleSort("amount")}>
                  {sortLabel("amount", "Montant")}
                </SortTh>
                <th className="px-5 py-3.5 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-zinc-400"
                  >
                    Aucun abonnement pour ces filtres.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <SubscriptionRow key={row.id} row={row} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SortTh({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <th className="px-5 py-3.5 font-medium">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-zinc-500 transition hover:text-zinc-900"
      >
        {children}
      </button>
    </th>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "amber" | "blue" | "violet";
}) {
  const tones = {
    neutral: "border-zinc-200/80 bg-white text-zinc-900",
    amber: "border-transparent bg-[#fff3e0] text-[#b86a00]",
    blue: "border-transparent bg-[#e8f1ff] text-[#1e4fbf]",
    violet: "border-transparent bg-[#f0e9ff] text-[#6b3bc4]",
  } as const;

  return (
    <div
      className={`rounded-[22px] border px-5 py-4 shadow-sm shadow-zinc-900/[0.03] ${tones[tone]}`}
    >
      <p className="text-[11px] font-semibold tracking-[0.08em] uppercase opacity-70">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs opacity-60">{hint}</p>
    </div>
  );
}

function SubscriptionRow({ row }: { row: AdminSubscriptionRow }) {
  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="px-5 py-3.5 whitespace-nowrap text-zinc-500">
        {new Date(row.createdAt).toLocaleString("fr-FR")}
      </td>
      <td className="px-5 py-3.5">
        <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700">
          {KIND_LABELS[row.kind]}
        </span>
      </td>
      <td className="px-5 py-3.5 font-medium text-zinc-900">{row.plan}</td>
      <td className="px-5 py-3.5">
        <p className="font-medium text-zinc-900">{row.party}</p>
        {row.partyEmail ? (
          <p className="text-xs text-zinc-400">{row.partyEmail}</p>
        ) : null}
      </td>
      <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-zinc-900">
        {formatFcfa(row.amountFcfa)}
      </td>
      <td className="px-5 py-3.5">
        <PaymentStatusBadge status={row.status} />
      </td>
    </tr>
  );
}

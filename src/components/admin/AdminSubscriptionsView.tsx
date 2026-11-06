"use client";

import { useMemo, useState } from "react";
import { PaymentStatusBadge } from "@/components/admin/PaymentStatusBadge";
import { CreditCardIcon, UserGroupIcon, UserIcon } from "@hugeicons/core-free-icons";
import {
  ConsoleEmpty,
  ConsoleHeader,
  ConsoleLink,
  ConsoleSearch,
  Kpi,
  KpiGrid,
  Panel,
  Pill,
  Segmented,
  T,
  Toolbar,
} from "@/components/admin/console/ui";
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
    <div className="space-y-5">
      <ConsoleHeader
        kicker="Finances"
        title="Abonnements"
        description="Revenus des plans artistes et labels, séparés des ventes de musique."
        actions={<ConsoleLink href="/goo-admin/transactions">Transactions</ConsoleLink>}
      />

      <KpiGrid cols={3}>
        <Kpi highlight label="Total encaissé" value={formatFcfa(totals.allCompletedFcfa)} sub="commandes réussies" icon={CreditCardIcon} />
        <Kpi
          label="Plans artistes"
          value={formatFcfa(totals.artistCompletedFcfa)}
          sub={`${totals.artistCount} abonnement${totals.artistCount > 1 ? "s" : ""}`}
          icon={UserIcon}
        />
        <Kpi
          label="Plans labels"
          value={formatFcfa(totals.labelCompletedFcfa)}
          sub={`${totals.labelCount} abonnement${totals.labelCount > 1 ? "s" : ""}`}
          icon={UserGroupIcon}
        />
      </KpiGrid>

      <Toolbar>
        <Segmented<SubscriptionKind | "all">
          value={kind}
          onChange={setKind}
          options={(["all", "artist_plan", "label_plan"] as const).map((id) => ({
            value: id,
            label: KIND_LABELS[id],
            count: counts[id] || 0,
          }))}
        />
        <Segmented<string>
          value={status}
          onChange={setStatus}
          options={(["all", "completed", "pending", "failed", "cancelled"] as const).map((id) => ({
            value: id,
            label: STATUS_LABELS[id],
          }))}
        />
        <ConsoleSearch value={query} onChange={setQuery} placeholder="Rechercher (compte, plan, commande…)" />
      </Toolbar>

      <Panel
        flush
        title="Commandes d'abonnement"
        subtitle={`${filtered.length} résultat${filtered.length > 1 ? "s" : ""}${query.trim() ? ` pour « ${query.trim()} »` : ""} · clique sur une colonne pour trier`}
      >
        <div className={T.wrap}>
          <table className={`${T.table} min-w-[900px]`}>
            <thead className={T.thead}>
              <tr>
                <SortTh onClick={() => toggleSort("date")}>{sortLabel("date", "Date")}</SortTh>
                <SortTh onClick={() => toggleSort("kind")}>{sortLabel("kind", "Type")}</SortTh>
                <SortTh onClick={() => toggleSort("plan")}>{sortLabel("plan", "Plan")}</SortTh>
                <SortTh onClick={() => toggleSort("party")}>{sortLabel("party", "Compte")}</SortTh>
                <SortTh onClick={() => toggleSort("amount")} right>{sortLabel("amount", "Montant")}</SortTh>
                <th className={T.th}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <ConsoleEmpty title="Aucun abonnement pour ces filtres" />
                  </td>
                </tr>
              ) : (
                filtered.map((row) => <SubscriptionRow key={row.id} row={row} />)
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function SortTh({
  children,
  onClick,
  right = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  right?: boolean;
}) {
  return (
    <th className={`${T.th} ${right ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 transition hover:text-zinc-200"
      >
        {children}
      </button>
    </th>
  );
}

function SubscriptionRow({ row }: { row: AdminSubscriptionRow }) {
  return (
    <tr className={T.tr}>
      <td className={`${T.td} whitespace-nowrap text-zinc-400`}>
        {new Date(row.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
      </td>
      <td className={T.td}>
        <Pill tone={row.kind === "label_plan" ? "info" : "violet"}>{KIND_LABELS[row.kind]}</Pill>
      </td>
      <td className={`${T.td} font-medium capitalize text-zinc-100`}>{row.plan}</td>
      <td className={T.td}>
        <p className={T.strong}>{row.party}</p>
        {row.partyEmail ? <p className={T.sub}>{row.partyEmail}</p> : null}
      </td>
      <td className={`${T.td} ${T.num} whitespace-nowrap text-right font-semibold`}>{formatFcfa(row.amountFcfa)}</td>
      <td className={T.td}>
        <PaymentStatusBadge status={row.status} />
      </td>
    </tr>
  );
}

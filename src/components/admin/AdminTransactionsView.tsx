"use client";

import { useMemo, useState } from "react";
import { PaymentStatusBadge } from "@/components/admin/PaymentStatusBadge";
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
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
  type PillTone,
} from "@/components/admin/console/ui";

const KIND_TONES: Record<LedgerKind, PillTone> = {
  purchase: "violet",
  label_plan: "info",
  artist_plan: "info",
  withdrawal: "warn",
};
import { formatFcfa } from "@/lib/format";
import type { AdminLedgerRow, LedgerKind } from "@/lib/admin/queries";

const KIND_LABELS: Record<LedgerKind, string> = {
  purchase: "Achat musique",
  label_plan: "Abo label",
  artist_plan: "Abo artiste",
  withdrawal: "Retrait",
};

const STATUS_LABELS: Record<string, string> = {
  all: "Tous",
  completed: "Réussi",
  pending: "Attente",
  failed: "Échec",
  cancelled: "Annulé",
};

export function AdminTransactionsView({ rows }: { rows: AdminLedgerRow[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<LedgerKind | "all">("all");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (kind !== "all" && row.kind !== kind) return false;
      if (status !== "all" && row.status !== status) return false;
      if (!q) return true;
      const hay = [
        row.title,
        row.party,
        row.partyEmail,
        row.counterparty,
        row.method,
        row.provider,
        row.orderId,
        row.phone,
        KIND_LABELS[row.kind],
        STATUS_LABELS[row.status] || row.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [kind, query, rows, status]);

  const counts = useMemo(() => {
    const byKind: Record<string, number> = {
      all: rows.length,
      purchase: 0,
      label_plan: 0,
      artist_plan: 0,
      withdrawal: 0,
    };
    const byStatus: Record<string, number> = {
      all: rows.length,
      completed: 0,
      pending: 0,
      failed: 0,
      cancelled: 0,
    };
    for (const row of rows) {
      byKind[row.kind] = (byKind[row.kind] || 0) + 1;
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    }
    return { byKind, byStatus };
  }, [rows]);

  const totals = useMemo(() => {
    let completedIn = 0;
    let pendingWithdrawals = 0;
    for (const row of rows) {
      if (row.status === "completed" && row.kind !== "withdrawal") completedIn += row.amountFcfa;
      if (row.status === "pending" && row.kind === "withdrawal") pendingWithdrawals += row.amountFcfa;
    }
    return { completedIn, pendingWithdrawals };
  }, [rows]);

  return (
    <div className="space-y-5">
      <ConsoleHeader
        kicker="Finances"
        title="Transactions"
        description="Achats, abonnements et retraits. Un paiement en attente passe en échec après 5 minutes."
        actions={<ConsoleLink href="/goo-admin/abonnements">Abonnements</ConsoleLink>}
      />

      <KpiGrid cols={4}>
        <Kpi highlight label="Encaissé (réussi)" value={formatFcfa(totals.completedIn)} sub="achats + abonnements" icon={CheckmarkCircle02Icon} />
        <Kpi label="Retraits à verser" value={formatFcfa(totals.pendingWithdrawals)} sub="en attente" icon={Wallet01Icon} />
        <Kpi label="En attente" value={counts.byStatus.pending || 0} icon={Clock01Icon} />
        <Kpi label="Échecs" value={counts.byStatus.failed || 0} icon={Alert02Icon} />
      </KpiGrid>

      <Toolbar>
        <Segmented<LedgerKind | "all">
          value={kind}
          onChange={setKind}
          options={(
            [
              ["all", "Tout"],
              ["purchase", "Achats"],
              ["label_plan", "Abo labels"],
              ["artist_plan", "Abo artistes"],
              ["withdrawal", "Retraits"],
            ] as const
          ).map(([id, label]) => ({ value: id, label, count: counts.byKind[id] || 0 }))}
        />
        <Segmented<string>
          value={status}
          onChange={setStatus}
          options={(["all", "completed", "pending", "failed", "cancelled"] as const).map((id) => ({
            value: id,
            label: STATUS_LABELS[id],
            count: counts.byStatus[id] || 0,
          }))}
        />
      </Toolbar>
      <ConsoleSearch value={query} onChange={setQuery} placeholder="Rechercher (nom, email, titre, commande, téléphone…)" />

      <Panel
        flush
        title="Grand livre"
        subtitle={`${filtered.length} résultat${filtered.length > 1 ? "s" : ""}${query.trim() ? ` pour « ${query.trim()} »` : ""}`}
      >
        <div className={T.wrap}>
          <table className={`${T.table} min-w-[1000px]`}>
            <thead className={T.thead}>
              <tr>
                <th className={T.th}>Date</th>
                <th className={T.th}>Catégorie</th>
                <th className={T.th}>Détail</th>
                <th className={T.th}>Compte</th>
                <th className={`${T.th} text-right`}>Montant</th>
                <th className={T.th}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <ConsoleEmpty title="Aucune transaction pour ces filtres" />
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className={T.tr}>
                    <td className={`${T.td} whitespace-nowrap text-zinc-400`}>
                      {new Date(row.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className={T.td}>
                      <Pill tone={KIND_TONES[row.kind]}>{KIND_LABELS[row.kind]}</Pill>
                    </td>
                    <td className={T.td}>
                      <p className={T.strong}>{row.title}</p>
                      <p className={T.sub}>
                        {row.counterparty}
                        {row.orderId ? <span className="font-mono"> · {row.orderId}</span> : ""}
                      </p>
                    </td>
                    <td className={T.td}>
                      <p className="text-zinc-200">{row.party}</p>
                      <p className={T.sub}>{row.partyEmail}</p>
                    </td>
                    <td
                      className={`${T.td} whitespace-nowrap text-right font-semibold tabular-nums ${
                        row.kind === "withdrawal" ? "text-amber-200" : "text-zinc-100"
                      }`}
                    >
                      {row.kind === "withdrawal" ? "−" : "+"}
                      {formatFcfa(row.amountFcfa)}
                    </td>
                    <td className={T.td}>
                      <PaymentStatusBadge status={row.status} />
                      <span className="mt-1 block text-[11px] text-zinc-500">
                        {row.method} · {row.provider}
                        {row.phone ? ` · ${row.phone}` : ""}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

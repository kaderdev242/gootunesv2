"use client";

import { useMemo, useState } from "react";
import { PaymentStatusBadge } from "@/components/admin/PaymentStatusBadge";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Transactions"
        description="Achats, abonnements et retraits — les paiements en attente passent en échec après 5 minutes."
        action={{ href: "/goo-admin/abonnements", label: "Abonnements" }}
      />

      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher (nom, email, titre, commande, téléphone…)"
          className="h-11 w-full rounded-2xl border border-zinc-200/80 bg-white px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#5b8def]/40 focus:ring-2 focus:ring-[#5b8def]/15"
        />

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", "Tout"],
              ["purchase", "Achats"],
              ["label_plan", "Abo labels"],
              ["artist_plan", "Abo artistes"],
              ["withdrawal", "Retraits"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setKind(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                kind === id
                  ? "bg-[#5b8def] text-white"
                  : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
              }`}
            >
              {label}
              <span className="ml-1 opacity-60">{counts.byKind[id] || 0}</span>
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
              <span className="ml-1 opacity-60">{counts.byStatus[id] || 0}</span>
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
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs text-zinc-400">
              <tr>
                <th className="px-5 py-3.5 font-medium">Date</th>
                <th className="px-5 py-3.5 font-medium">Catégorie</th>
                <th className="px-5 py-3.5 font-medium">Détail</th>
                <th className="px-5 py-3.5 font-medium">Compte</th>
                <th className="px-5 py-3.5 font-medium">Montant</th>
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
                    Aucune transaction pour ces filtres.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap text-zinc-500">
                      {new Date(row.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700">
                        {KIND_LABELS[row.kind]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-zinc-800">{row.title}</p>
                      <p className="text-[11px] text-zinc-400">
                        {row.counterparty}
                        {row.orderId ? ` · ${row.orderId}` : ""}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-zinc-800">{row.party}</p>
                      <p className="text-xs text-zinc-400">{row.partyEmail}</p>
                    </td>
                    <td className="px-5 py-3.5 tabular-nums text-zinc-800">
                      {formatFcfa(row.amountFcfa)}
                    </td>
                    <td className="px-5 py-3.5">
                      <PaymentStatusBadge status={row.status} />
                      <span className="mt-1 block text-[11px] text-zinc-400">
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
      </div>
    </div>
  );
}

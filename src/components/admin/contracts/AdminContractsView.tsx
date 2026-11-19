"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AdminContractRow, AdminContractStatus } from "@/lib/contracts/admin-queries";
import {
  ConsoleEmpty,
  ConsoleHeader,
  ConsoleLink,
  ConsoleSearch,
  Initial,
  Kpi,
  KpiGrid,
  Panel,
  Pill,
  Segmented,
  T,
  Toolbar,
  consoleButtonClass,
} from "@/components/admin/console/ui";

type StatusFilter = "all" | AdminContractStatus;
type RoleFilter = "all" | "artist" | "label";

const STATUS: Record<AdminContractStatus, { label: string; tone: "ok" | "warn" | "neutral" }> = {
  signed: { label: "Signé", tone: "ok" },
  outdated: { label: "Ancienne version", tone: "warn" },
  missing: { label: "Non signé", tone: "neutral" },
};

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export function AdminContractsView({ rows, version }: { rows: AdminContractRow[]; version: string }) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [role, setRole] = useState<RoleFilter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      signed: rows.filter((r) => r.status === "signed").length,
      outdated: rows.filter((r) => r.status === "outdated").length,
      missing: rows.filter((r) => r.status === "missing").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (role === "all" || r.role === role) &&
        (!q || `${r.name} ${r.email} ${r.signerName ?? ""}`.toLowerCase().includes(q)),
    );
  }, [rows, status, role, query]);

  return (
    <div className="space-y-6">
      <ConsoleHeader
        title="Contrats"
        description={`Contrats de distribution signés par les artistes et les labels. Version en vigueur : ${version}.`}
        actions={
          <>
            <ConsoleLink href="/contrat" tone="ghost">
              Voir le modèle public
            </ConsoleLink>
          </>
        }
      />

      <KpiGrid cols={3}>
        <Kpi label="Signés (version en vigueur)" value={counts.signed} highlight />
        <Kpi label="Ancienne version" value={counts.outdated} />
        <Kpi label="Non signés" value={counts.missing} />
      </KpiGrid>

      <Toolbar>
        <ConsoleSearch value={query} onChange={setQuery} placeholder="Rechercher un artiste, un label ou un signataire" />
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Tous" },
            { value: "signed", label: "Signés", count: counts.signed },
            { value: "outdated", label: "À re-signer", count: counts.outdated },
            { value: "missing", label: "Non signés", count: counts.missing },
          ]}
        />
        <Segmented
          value={role}
          onChange={setRole}
          options={[
            { value: "all", label: "Artistes et labels" },
            { value: "artist", label: "Artistes" },
            { value: "label", label: "Labels" },
          ]}
        />
      </Toolbar>

      <Panel flush>
        {filtered.length === 0 ? (
          <ConsoleEmpty title="Aucun créateur ne correspond" />
        ) : (
          <div className={T.wrap}>
            <table className={T.table}>
              <thead className={T.thead}>
                <tr>
                  <th className={T.th}>Créateur</th>
                  <th className={T.th}>Statut</th>
                  <th className={`${T.th} hidden md:table-cell`}>Signataire</th>
                  <th className={`${T.th} hidden sm:table-cell`}>Signé le</th>
                  <th className={T.th} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.contractId ?? r.userId} className={T.tr}>
                    <td className={T.td}>
                      <div className="flex min-w-0 items-center gap-3">
                        {r.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.avatarUrl} alt="" className="size-9 shrink-0 rounded-full object-cover" />
                        ) : (
                          <Initial name={r.name} className="size-9" />
                        )}
                        <div className="min-w-0">
                          <p className={`${T.strong} truncate`}>{r.name}</p>
                          <p className={`${T.sub} truncate`}>
                            {r.role === "label" ? "Label" : "Artiste"}
                            {r.userId ? "" : " · compte supprimé"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={T.td}>
                      <Pill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Pill>
                    </td>
                    <td className={`${T.td} hidden text-white/70 md:table-cell`}>{r.signerName ?? "—"}</td>
                    <td className={`${T.td} hidden text-white/55 sm:table-cell`}>
                      {r.signedAt ? dateFmt.format(new Date(r.signedAt)) : "—"}
                    </td>
                    <td className={`${T.td} text-right`}>
                      {r.contractId ? (
                        <div className="flex justify-end gap-2">
                          <Link href={`/goo-admin/contrats/${r.contractId}`} className={consoleButtonClass("ghost", "sm")}>
                            Consulter
                          </Link>
                          <a
                            href={`/api/contrats/${r.contractId}`}
                            download
                            className={`${consoleButtonClass("subtle", "sm")} hidden sm:inline-flex`}
                          >
                            PDF
                          </a>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

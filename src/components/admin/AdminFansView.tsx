"use client";

import { useMemo, useState } from "react";
import {
  Calendar03Icon,
  Globe02Icon,
  UserBlock01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { SuspendUserButton } from "@/components/admin/AdminActionForms";
import {
  ConsoleEmpty,
  ConsoleHeader,
  ConsoleSearch,
  Initial,
  Kpi,
  KpiGrid,
  Panel,
  Pill,
  Segmented,
  T,
  Toolbar,
} from "@/components/admin/console/ui";

export type AdminFanRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  country: string | null;
  created_at: string;
  is_suspended: boolean;
};

type Filter = "all" | "active" | "suspended";

export function AdminFansView({ fans }: { fans: AdminFanRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [now] = useState(() => Date.now());
  const since30 = now - 30 * 86400000;
  const newCount = fans.filter((f) => new Date(f.created_at).getTime() >= since30).length;
  const suspended = fans.filter((f) => f.is_suspended).length;
  const topCountry = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of fans) if (f.country) m.set(f.country, (m.get(f.country) || 0) + 1);
    const best = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
    return best ? `${best[0]} · ${best[1]}` : "—";
  }, [fans]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fans.filter((f) => {
      if (filter === "active" && f.is_suspended) return false;
      if (filter === "suspended" && !f.is_suspended) return false;
      if (!q) return true;
      return [f.display_name, f.email, f.country].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [fans, filter, query]);

  return (
    <div className="space-y-5">
      <ConsoleHeader
        kicker="Communauté"
        title="Fans"
        description="Les auditeurs inscrits sur Gootunes."
      />

      <KpiGrid cols={4}>
        <Kpi highlight label="Comptes fans" value={fans.length.toLocaleString("fr-FR")} icon={UserIcon} />
        <Kpi label="Nouveaux (30 j)" value={newCount.toLocaleString("fr-FR")} icon={Calendar03Icon} />
        <Kpi label="Pays principal" value={topCountry} icon={Globe02Icon} />
        <Kpi label="Suspendus" value={suspended} icon={UserBlock01Icon} />
      </KpiGrid>

      <Toolbar>
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Tous", count: fans.length },
            { value: "active", label: "Actifs", count: fans.length - suspended },
            { value: "suspended", label: "Suspendus", count: suspended },
          ]}
        />
        <ConsoleSearch value={query} onChange={setQuery} placeholder="Rechercher (nom, email, pays…)" />
      </Toolbar>

      <Panel flush title="Comptes" subtitle={`${rows.length} résultat${rows.length > 1 ? "s" : ""}`}>
        <div className={T.wrap}>
          <table className={`${T.table} min-w-[680px]`}>
            <thead className={T.thead}>
              <tr>
                <th className={T.th}>Compte</th>
                <th className={T.th}>Pays</th>
                <th className={T.th}>Inscription</th>
                <th className={T.th}>Statut</th>
                <th className={`${T.th} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <ConsoleEmpty title="Aucun fan trouvé" />
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.id} className={T.tr}>
                    <td className={T.td}>
                      <div className="flex items-center gap-3">
                        <Initial name={p.display_name || p.email || "?"} />
                        <div className="min-w-0">
                          <p className={`${T.strong} truncate`}>{p.display_name || "—"}</p>
                          <p className={`${T.sub} truncate`}>{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`${T.td} text-zinc-400`}>{p.country || "—"}</td>
                    <td className={`${T.td} whitespace-nowrap text-zinc-400`}>
                      {new Date(p.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className={T.td}>
                      {p.is_suspended ? <Pill tone="danger" dot>Suspendu</Pill> : <Pill tone="ok" dot>Actif</Pill>}
                    </td>
                    <td className={`${T.td} text-right`}>
                      <div className="flex justify-end">
                        <SuspendUserButton userId={p.id} suspended={p.is_suspended} />
                      </div>
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

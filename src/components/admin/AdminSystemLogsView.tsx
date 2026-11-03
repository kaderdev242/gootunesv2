"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  ArrowDown01Icon,
  Clock01Icon,
  CodeIcon,
  File01Icon,
} from "@hugeicons/core-free-icons";
import type { AdminSystemLog } from "@/lib/admin/queries";
import {
  ConsoleEmpty,
  ConsoleHeader,
  ConsoleSearch,
  Kpi,
  KpiGrid,
  Panel,
  Pill,
  Segmented,
  Toolbar,
} from "@/components/admin/console/ui";

export function AdminSystemLogsView({ logs }: { logs: AdminSystemLog[] }) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const sources = useMemo(() => {
    const set = new Set(logs.map((l) => l.source).filter(Boolean));
    return [...set].sort();
  }, [logs]);

  const [now] = useState(() => Date.now());
  const last24h = logs.filter((l) => now - new Date(l.createdAt).getTime() < 86400000).length;
  const topPath = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of logs) if (l.path) m.set(l.path, (m.get(l.path) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  }, [logs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((log) => {
      if (source !== "all" && log.source !== source) return false;
      if (!q) return true;
      return [log.message, log.path, log.source, log.digest, log.stack, log.userAgent]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [logs, query, source]);

  return (
    <div className="space-y-5">
      <ConsoleHeader
        kicker="Système"
        title="Logs"
        description="Erreurs côté navigateur et serveur, avec la page concernée et la pile d'appel."
      />

      <KpiGrid cols={4}>
        <Kpi highlight label="Erreurs (24 h)" value={last24h} icon={Alert02Icon} />
        <Kpi label="Total enregistré" value={logs.length} icon={File01Icon} />
        <Kpi label="Sources" value={sources.length} icon={CodeIcon} />
        <Kpi label="Page la plus touchée" value={<span className="block truncate text-[15px] font-mono">{topPath}</span>} icon={Clock01Icon} />
      </KpiGrid>

      <Toolbar>
        <Segmented<string>
          value={source}
          onChange={setSource}
          options={[
            { value: "all", label: "Toutes", count: logs.length },
            ...sources.map((s) => ({ value: s, label: s, count: logs.filter((l) => l.source === s).length })),
          ]}
        />
        <ConsoleSearch value={query} onChange={setQuery} placeholder="Rechercher un message, une page, un digest…" />
      </Toolbar>

      <Panel flush title="Journal" subtitle={`${filtered.length} entrée${filtered.length > 1 ? "s" : ""}`}>
        {filtered.length === 0 ? (
          <ConsoleEmpty
            title="Aucune erreur pour ces filtres"
            hint={logs.length === 0 ? "Applique la migration 020_system_logs si la table n'existe pas encore." : undefined}
          />
        ) : (
          <ul className="font-mono text-[12px]">
            {filtered.map((log) => {
              const open = openId === log.id;
              return (
                <li key={log.id} className="border-t border-white/[0.05]">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : log.id)}
                    className="flex w-full items-start gap-3 px-5 py-2.5 text-left transition hover:bg-white/[0.025]"
                  >
                    <span className="mt-0.5 w-[118px] shrink-0 tabular-nums text-zinc-500">
                      {new Date(log.createdAt).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <span className="shrink-0">
                      <Pill tone={log.level === "error" ? "danger" : "warn"}>{log.level}</Pill>
                    </span>
                    <span className="shrink-0">
                      <Pill tone="violet">{log.source}</Pill>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-zinc-100">{log.message}</span>
                      <span className="block truncate text-[11px] text-zinc-500">{log.path || "chemin inconnu"}</span>
                    </span>
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      size={14}
                      className={`mt-1 shrink-0 text-zinc-500 transition ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  {open ? (
                    <div className="space-y-2 px-5 pb-4">
                      {log.digest ? (
                        <p className="text-[11px] text-zinc-500">
                          digest <span className="text-zinc-300">{log.digest}</span>
                        </p>
                      ) : null}
                      {log.stack ? (
                        <pre className="max-h-80 overflow-auto rounded-xl border border-white/[0.06] bg-black/60 p-3 text-[11px] leading-relaxed text-violet-100/90">
                          {log.stack}
                        </pre>
                      ) : (
                        <p className="text-[11px] text-zinc-500">Pas de pile d&apos;appel.</p>
                      )}
                      {log.userAgent ? (
                        <p className="truncate text-[11px] text-zinc-600">{log.userAgent}</p>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

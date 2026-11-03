"use client";

import { useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { AdminSystemLog } from "@/lib/admin/queries";

export function AdminSystemLogsView({ logs }: { logs: AdminSystemLog[] }) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const sources = useMemo(() => {
    const set = new Set(logs.map((l) => l.source).filter(Boolean));
    return ["all", ...[...set].sort()];
  }, [logs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((log) => {
      if (source !== "all" && log.source !== source) return false;
      if (!q) return true;
      const hay = [
        log.message,
        log.path,
        log.source,
        log.digest,
        log.stack,
        log.userAgent,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [logs, query, source]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Logs système"
        description="Erreurs client et serveur : message, page, et pile d'appel."
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un bug, une page, un digest…"
          className="h-11 flex-1 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none ring-zinc-900/10 placeholder:text-zinc-400 focus:ring-2"
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-800"
        >
          {sources.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "Toutes les sources" : s}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-zinc-400">
        {filtered.length} log{filtered.length > 1 ? "s" : ""}
        {logs.length === 0
          ? " — applique la migration 020_system_logs si la table n’existe pas encore."
          : ""}
      </p>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-[28px] border border-zinc-200/80 bg-white px-6 py-12 text-center text-sm text-zinc-400">
            Aucune erreur enregistrée pour ces filtres.
          </div>
        ) : (
          filtered.map((log) => {
            const open = openId === log.id;
            return (
              <article
                key={log.id}
                className="rounded-[24px] border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-900/5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                        {log.level}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                        {log.source}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {new Date(log.createdAt).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-zinc-900">
                      {log.message}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Où :{" "}
                      <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-700">
                        {log.path || "chemin inconnu"}
                      </code>
                      {log.digest ? (
                        <>
                          {" "}
                          · digest{" "}
                          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px]">
                            {log.digest}
                          </code>
                        </>
                      ) : null}
                    </p>
                  </div>
                  {log.stack ? (
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : log.id)}
                      className="shrink-0 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                    >
                      {open ? "Masquer la pile" : "Voir où ça casse"}
                    </button>
                  ) : null}
                </div>
                {open && log.stack ? (
                  <pre className="mt-3 max-h-72 overflow-auto rounded-2xl bg-zinc-950 p-3 text-[11px] leading-relaxed text-zinc-200">
                    {log.stack}
                  </pre>
                ) : null}
                {log.userAgent ? (
                  <p className="mt-2 truncate text-[11px] text-zinc-400">
                    {log.userAgent}
                  </p>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Add01Icon } from "@hugeicons/core-free-icons";
import type { AdminBlogRow } from "@/lib/blog/queries";
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
  consoleButtonClass,
} from "@/components/admin/console/ui";

type Filter = "all" | "published" | "draft";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export function AdminBlogView({ posts }: { posts: AdminBlogRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const published = posts.filter((p) => p.status === "published").length;
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(
      (p) => (filter === "all" || p.status === filter) && (!q || `${p.title} ${p.slug}`.toLowerCase().includes(q)),
    );
  }, [posts, filter, query]);

  return (
    <div className="space-y-6">
      <ConsoleHeader
        title="Blog"
        description="Actualités, annonces et contenus éditoriaux publiés sur gootunes.com/blog."
        actions={
          <>
            <ConsoleLink href="/blog" tone="ghost">
              Voir le blog
            </ConsoleLink>
            <ConsoleLink href="/goo-admin/blog/nouveau" tone="primary" icon={Add01Icon}>
              Nouvel article
            </ConsoleLink>
          </>
        }
      />

      <KpiGrid cols={3}>
        <Kpi label="Articles" value={posts.length} />
        <Kpi label="Publiés" value={published} />
        <Kpi label="Brouillons" value={posts.length - published} />
      </KpiGrid>

      <Toolbar>
        <ConsoleSearch value={query} onChange={setQuery} placeholder="Rechercher un article" />
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Tous" },
            { value: "published", label: "Publiés" },
            { value: "draft", label: "Brouillons" },
          ]}
        />
      </Toolbar>

      <Panel flush>
        {rows.length === 0 ? (
          <ConsoleEmpty
            title={posts.length === 0 ? "Aucun article pour l'instant" : "Aucun article ne correspond"}
            hint={posts.length === 0 ? "Commence par écrire ton premier article." : undefined}
          />
        ) : (
          <div className={T.wrap}>
            <table className={T.table}>
              <thead className={T.thead}>
                <tr>
                  <th className={T.th}>Article</th>
                  <th className={T.th}>Statut</th>
                  <th className={`${T.th} hidden md:table-cell`}>Modifié</th>
                  <th className={T.th} />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className={T.tr}>
                    <td className={T.td}>
                      <Link href={`/goo-admin/blog/${p.id}`} className="flex min-w-0 items-center gap-3">
                        {p.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.cover_url} alt="" className="h-10 w-16 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <span className="h-10 w-16 shrink-0 rounded-lg bg-white/[0.05]" />
                        )}
                        <span className="min-w-0">
                          <span className={`${T.strong} line-clamp-1`}>{p.title}</span>
                          <span className={`${T.sub} line-clamp-1`}>/blog/{p.slug}</span>
                        </span>
                      </Link>
                    </td>
                    <td className={T.td}>
                      <Pill tone={p.status === "published" ? "ok" : "neutral"}>
                        {p.status === "published" ? "Publié" : "Brouillon"}
                      </Pill>
                    </td>
                    <td className={`${T.td} hidden text-white/55 md:table-cell`}>
                      {dateFmt.format(new Date(p.updated_at))}
                    </td>
                    <td className={`${T.td} text-right`}>
                      <Link href={`/goo-admin/blog/${p.id}`} className={consoleButtonClass("ghost", "sm")}>
                        Modifier
                      </Link>
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

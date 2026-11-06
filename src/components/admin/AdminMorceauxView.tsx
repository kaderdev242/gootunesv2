"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Folder01Icon,
  MusicNote01Icon,
  ViewOffIcon,
  Album02Icon,
} from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import {
  DeleteReleaseButton,
  HideReleaseButton,
} from "@/components/admin/AdminActionForms";
import { formatFcfa, formatCount } from "@/lib/format";
import {
  ConsoleEmpty,
  ConsoleHeader,
  ConsoleSearch,
  Kpi,
  KpiGrid,
  Panel,
  Pill,
  Segmented,
  T,
  Toolbar,
} from "@/components/admin/console/ui";

export type AdminReleaseRow = {
  id: string;
  publicId: string;
  title: string;
  type: "single" | "album";
  status: string;
  price_fcfa: number;
  genre: string | null;
  cover_url: string | null;
  is_hidden: boolean;
  created_at: string;
  artistName: string;
  ownerEmail: string | null;
};

type TypeFilter = "all" | "album" | "single";
type VisFilter = "all" | "visible" | "hidden";

export function AdminMorceauxView({ releases }: { releases: AdminReleaseRow[] }) {
  const [type, setType] = useState<TypeFilter>("all");
  const [vis, setVis] = useState<VisFilter>("all");
  const [query, setQuery] = useState("");

  const albumCount = releases.filter((r) => r.type === "album").length;
  const singleCount = releases.filter((r) => r.type === "single").length;
  const hiddenCount = releases.filter((r) => r.is_hidden).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return releases.filter((r) => {
      if (type !== "all" && r.type !== type) return false;
      if (vis === "visible" && r.is_hidden) return false;
      if (vis === "hidden" && !r.is_hidden) return false;
      if (!q) return true;
      return [r.title, r.artistName, r.ownerEmail, r.genre, r.publicId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [query, releases, type, vis]);

  return (
    <div className="space-y-5">
      <ConsoleHeader
        kicker="Catalogue"
        title="Morceaux"
        description="Toutes les sorties publiées. Masque une sortie pour la retirer de Discover sans la supprimer."
      />

      <KpiGrid cols={4}>
        <Kpi highlight label="Publications" value={formatCount(releases.length)} icon={Folder01Icon} />
        <Kpi label="Albums" value={albumCount} icon={Album02Icon} />
        <Kpi label="Singles" value={singleCount} icon={MusicNote01Icon} />
        <Kpi label="Masquées" value={hiddenCount} icon={ViewOffIcon} />
      </KpiGrid>

      <Toolbar>
        <Segmented<TypeFilter>
          value={type}
          onChange={setType}
          options={[
            { value: "all", label: "Tout", count: releases.length },
            { value: "album", label: "Albums", count: albumCount },
            { value: "single", label: "Singles", count: singleCount },
          ]}
        />
        <Segmented<VisFilter>
          value={vis}
          onChange={setVis}
          options={[
            { value: "all", label: "Toutes" },
            { value: "visible", label: "Visibles" },
            { value: "hidden", label: "Masquées", count: hiddenCount },
          ]}
        />
        <ConsoleSearch value={query} onChange={setQuery} placeholder="Rechercher (titre, artiste, genre, ID…)" />
      </Toolbar>

      <Panel flush title="Sorties" subtitle={`${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`}>
        <div className={T.wrap}>
          <table className={`${T.table} min-w-[900px]`}>
            <thead className={T.thead}>
              <tr>
                <th className={T.th}>Sortie</th>
                <th className={T.th}>Artiste</th>
                <th className={T.th}>Publiée le</th>
                <th className={`${T.th} text-right`}>Prix</th>
                <th className={T.th}>Visibilité</th>
                <th className={`${T.th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <ConsoleEmpty title="Aucune sortie pour ces filtres" />
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className={`${T.tr} ${r.is_hidden ? "opacity-70" : ""}`}>
                    <td className={T.td}>
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
                          {r.cover_url ? (
                            <AppImage src={r.cover_url} alt="" fill className="object-cover" sizes="40px" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/discover/release/${r.publicId}`}
                            target="_blank"
                            className={`${T.strong} block truncate hover:text-violet-200`}
                          >
                            {r.title}
                          </Link>
                          <p className={T.sub}>
                            {r.type === "album" ? "Album" : "Single"} · {r.genre || "Sans genre"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={T.td}>
                      <p className="text-zinc-200">{r.artistName}</p>
                      <p className={T.sub}>{r.ownerEmail}</p>
                    </td>
                    <td className={`${T.td} whitespace-nowrap text-zinc-400`}>
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className={`${T.td} ${T.num} text-right`}>{formatFcfa(r.price_fcfa || 0)}</td>
                    <td className={T.td}>
                      {r.is_hidden ? <Pill tone="warn" dot>Masquée</Pill> : <Pill tone="ok" dot>En ligne</Pill>}
                    </td>
                    <td className={T.td}>
                      <div className="flex items-center justify-end gap-1.5">
                        <HideReleaseButton releaseId={r.id} hidden={r.is_hidden} />
                        <DeleteReleaseButton releaseId={r.id} title={r.title} />
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

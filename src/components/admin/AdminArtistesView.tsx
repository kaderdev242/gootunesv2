"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckmarkBadge01Icon,
  UserBlock01Icon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import {
  CreatorPlanControls,
  SuspendUserButton,
  VerifyArtistButton,
} from "@/components/admin/AdminActionForms";
import { VerifiedBadge } from "@/components/discover/VerifiedBadge";
import { AppImage } from "@/components/media/AppImage";
import { FALLBACK_COVER } from "@/lib/types/music";
import type { ArtistPlan, LabelPlan } from "@/lib/supabase/database.types";
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
  consoleButtonClass,
} from "@/components/admin/console/ui";

export type AdminCreatorRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  country: string | null;
  is_suspended: boolean;
  created_at: string;
  artist_plan: ArtistPlan | null;
  artist_plan_expires_at: string | null;
  label_plan: LabelPlan | null;
  label_plan_expires_at: string | null;
  kind: "Artiste" | "Label";
  catalogId: string | null;
};

export type AdminCatalogArtistRow = {
  id: string;
  public_id: string;
  stage_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  owner_id: string;
  ownerName: string;
  ownerEmail: string;
  ownerRole: string;
};

type Tab = "artist" | "label";
type View = "accounts" | "catalog";

export function AdminArtistesView({
  rows,
  catalogArtists,
}: {
  rows: AdminCreatorRow[];
  catalogArtists: AdminCatalogArtistRow[];
}) {
  const [tab, setTab] = useState<Tab>("artist");
  const [view, setView] = useState<View>("accounts");
  const [query, setQuery] = useState("");

  const artistCount = rows.filter((r) => r.kind === "Artiste").length;
  const labelCount = rows.filter((r) => r.kind === "Label").length;
  const suspendedCount = rows.filter((r) => r.is_suspended).length;
  const verifiedCount = catalogArtists.filter((a) => a.is_verified).length;

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab === "artist" && r.kind !== "Artiste") return false;
      if (tab === "label" && r.kind !== "Label") return false;
      if (!q) return true;
      return [r.display_name, r.email, r.country, r.kind]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [query, rows, tab]);

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogArtists.filter((a) => {
      if (tab === "artist" && a.ownerRole === "label") return false;
      if (tab === "label" && a.ownerRole !== "label") return false;
      if (!q) return true;
      return [a.stage_name, a.public_id, a.ownerName, a.ownerEmail]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [catalogArtists, query, tab]);

  return (
    <div className="space-y-5">
      <ConsoleHeader
        kicker="Communauté"
        title="Artistes & labels"
        description="Comptes créateurs, abonnements, suspensions et certification des profils."
      />

      <KpiGrid cols={4}>
        <Kpi label="Artistes" value={artistCount.toLocaleString("fr-FR")} icon={UserIcon} highlight />
        <Kpi label="Labels" value={labelCount.toLocaleString("fr-FR")} icon={UserGroupIcon} />
        <Kpi
          label="Profils certifiés"
          value={`${verifiedCount} / ${catalogArtists.length}`}
          icon={CheckmarkBadge01Icon}
        />
        <Kpi label="Comptes suspendus" value={suspendedCount} icon={UserBlock01Icon} />
      </KpiGrid>

      <Toolbar>
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "artist", label: "Artistes", count: artistCount },
            { value: "label", label: "Labels", count: labelCount },
          ]}
        />
        <Segmented<View>
          value={view}
          onChange={setView}
          options={[
            { value: "accounts", label: "Comptes & abonnements" },
            { value: "catalog", label: "Certification" },
          ]}
        />
        <ConsoleSearch
          value={query}
          onChange={setQuery}
          placeholder={`Rechercher ${tab === "artist" ? "un artiste" : "un label"} (nom, email, pays…)`}
        />
      </Toolbar>

      {view === "accounts" ? (
        <Panel
          flush
          title="Comptes & abonnements"
          subtitle={`${filteredRows.length} résultat${filteredRows.length > 1 ? "s" : ""}${query.trim() ? ` pour « ${query.trim()} »` : ""}`}
        >
          <div className={T.wrap}>
            <table className={`${T.table} min-w-[920px]`}>
              <thead className={T.thead}>
                <tr>
                  <th className={T.th}>Compte</th>
                  <th className={T.th}>Pays</th>
                  <th className={T.th}>Inscription</th>
                  <th className={T.th}>Abonnement</th>
                  <th className={T.th}>Statut</th>
                  <th className={`${T.th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <ConsoleEmpty title={`Aucun ${tab === "artist" ? "artiste" : "label"} trouvé`} />
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((p) => {
                    const name = p.display_name || "—";
                    const identity = (
                      <div className="flex items-center gap-3">
                        <Initial name={name} />
                        <div className="min-w-0">
                          <p className={`${T.strong} truncate`}>{name}</p>
                          <p className={`${T.sub} truncate`}>{p.email}</p>
                        </div>
                      </div>
                    );
                    return (
                      <tr key={p.id} className={T.tr}>
                        <td className={T.td}>
                          {p.catalogId ? (
                            <Link href={`/goo-admin/artistes/${p.catalogId}`} className="block transition hover:opacity-80">
                              {identity}
                            </Link>
                          ) : (
                            identity
                          )}
                        </td>
                        <td className={`${T.td} text-zinc-400`}>{p.country || "—"}</td>
                        <td className={`${T.td} whitespace-nowrap text-zinc-400`}>
                          {new Date(p.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className={T.td}>
                          <CreatorPlanControls
                            userId={p.id}
                            role={p.role === "label" ? "label" : "artist"}
                            artistPlan={p.artist_plan}
                            artistPlanExpiresAt={p.artist_plan_expires_at}
                            labelPlan={p.label_plan}
                            labelPlanExpiresAt={p.label_plan_expires_at}
                          />
                        </td>
                        <td className={T.td}>
                          {p.is_suspended ? (
                            <Pill tone="danger" dot>Suspendu</Pill>
                          ) : (
                            <Pill tone="ok" dot>Actif</Pill>
                          )}
                        </td>
                        <td className={T.td}>
                          <div className="flex items-center justify-end gap-1.5">
                            {p.catalogId ? (
                              <Link href={`/goo-admin/artistes/${p.catalogId}`} className={consoleButtonClass("subtle", "sm")}>
                                Détail
                              </Link>
                            ) : null}
                            <SuspendUserButton userId={p.id} suspended={p.is_suspended} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : (
        <Panel
          flush
          title="Certification catalogue"
          subtitle="Le badge apparaît sur le profil public et à côté du nom dans Discover."
        >
          <div className={T.wrap}>
            <table className={`${T.table} min-w-[820px]`}>
              <thead className={T.thead}>
                <tr>
                  <th className={T.th}>Profil</th>
                  <th className={T.th}>Compte propriétaire</th>
                  <th className={T.th}>Badge</th>
                  <th className={`${T.th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalog.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <ConsoleEmpty title="Aucun profil catalogue trouvé" />
                    </td>
                  </tr>
                ) : (
                  filteredCatalog.map((a) => (
                    <tr key={a.id} className={T.tr}>
                      <td className={T.td}>
                        <Link href={`/goo-admin/artistes/${a.id}`} className="flex items-center gap-3 transition hover:opacity-80">
                          <span className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
                            <AppImage src={a.avatar_url || FALLBACK_COVER} alt="" fill className="object-cover" sizes="36px" />
                          </span>
                          <div className="min-w-0">
                            <p className={`${T.strong} inline-flex items-center gap-1.5`}>
                              {a.stage_name}
                              {a.is_verified ? <VerifiedBadge size={13} /> : null}
                            </p>
                            <p className={`${T.sub} font-mono`}>{a.public_id}</p>
                          </div>
                        </Link>
                      </td>
                      <td className={T.td}>
                        <p className="text-zinc-200">{a.ownerName}</p>
                        <p className={T.sub}>
                          {a.ownerEmail}
                          {a.ownerRole ? ` · ${a.ownerRole}` : ""}
                        </p>
                      </td>
                      <td className={T.td}>
                        {a.is_verified ? <Pill tone="violet" dot>Certifié</Pill> : <Pill>Non certifié</Pill>}
                      </td>
                      <td className={T.td}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/goo-admin/artistes/${a.id}`} className={consoleButtonClass("subtle", "sm")}>
                            Détail
                          </Link>
                          <VerifyArtistButton artistId={a.id} verified={Boolean(a.is_verified)} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

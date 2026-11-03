"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CreatorPlanControls,
  SuspendUserButton,
  VerifyArtistButton,
} from "@/components/admin/AdminActionForms";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { VerifiedBadge } from "@/components/discover/VerifiedBadge";
import { AppImage } from "@/components/media/AppImage";
import { FALLBACK_COVER } from "@/lib/types/music";
import type { ArtistPlan, LabelPlan } from "@/lib/supabase/database.types";

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

export function AdminArtistesView({
  rows,
  catalogArtists,
}: {
  rows: AdminCreatorRow[];
  catalogArtists: AdminCatalogArtistRow[];
}) {
  const [tab, setTab] = useState<Tab>("artist");
  const [query, setQuery] = useState("");

  const artistCount = rows.filter((r) => r.kind === "Artiste").length;
  const labelCount = rows.filter((r) => r.kind === "Label").length;

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab === "artist" && r.kind !== "Artiste") return false;
      if (tab === "label" && r.kind !== "Label") return false;
      if (!q) return true;
      const hay = [r.display_name, r.email, r.country, r.kind]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, rows, tab]);

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogArtists.filter((a) => {
      if (tab === "artist" && a.ownerRole === "label") return false;
      if (tab === "label" && a.ownerRole !== "label") return false;
      if (!q) return true;
      const hay = [a.stage_name, a.public_id, a.ownerName, a.ownerEmail]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [catalogArtists, query, tab]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <AdminPageHeader
          title="Artistes & labels"
          description={`${rows.length} comptes créateurs · ${catalogArtists.length} profils catalogue`}
        />
        <div className="inline-flex rounded-2xl bg-zinc-200/70 p-1">
          <button
            type="button"
            onClick={() => setTab("artist")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === "artist"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Artistes
            <span className="ml-2 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-500">
              {artistCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("label")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === "label"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Labels
            <span className="ml-2 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-500">
              {labelCount}
            </span>
          </button>
        </div>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={
          tab === "artist"
            ? "Rechercher un artiste (nom, email, pays…)"
            : "Rechercher un label (nom, email, pays…)"
        }
        className="h-11 w-full rounded-2xl border border-zinc-200/80 bg-white px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#5b8def]/40 focus:ring-2 focus:ring-[#5b8def]/15"
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-zinc-900">
            Comptes & abonnements
          </h2>
          <p className="text-xs text-zinc-400">
            {filteredRows.length} résultat
            {filteredRows.length > 1 ? "s" : ""}
            {query.trim() ? ` pour « ${query.trim()} »` : ""}
          </p>
        </div>
        <div className="overflow-hidden rounded-[24px] border border-zinc-200/70 bg-white shadow-sm shadow-zinc-900/[0.03]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Compte</th>
                  <th className="px-5 py-3.5 font-medium">Pays</th>
                  <th className="px-5 py-3.5 font-medium">Abonnement</th>
                  <th className="px-5 py-3.5 font-medium">Statut</th>
                  <th className="px-5 py-3.5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-zinc-400"
                    >
                      Aucun {tab === "artist" ? "artiste" : "label"} trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="px-5 py-3.5">
                        {p.catalogId ? (
                          <Link
                            href={`/goo-admin/artistes/${p.catalogId}`}
                            className="group"
                          >
                            <p className="font-medium text-zinc-900 group-hover:underline">
                              {p.display_name || "—"}
                            </p>
                            <p className="text-xs text-zinc-400">{p.email}</p>
                          </Link>
                        ) : (
                          <>
                            <p className="font-medium text-zinc-900">
                              {p.display_name || "—"}
                            </p>
                            <p className="text-xs text-zinc-400">{p.email}</p>
                          </>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-500">
                        {p.country || "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <CreatorPlanControls
                          userId={p.id}
                          role={p.role === "label" ? "label" : "artist"}
                          artistPlan={p.artist_plan}
                          artistPlanExpiresAt={p.artist_plan_expires_at}
                          labelPlan={p.label_plan}
                          labelPlanExpiresAt={p.label_plan_expires_at}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        {p.is_suspended ? (
                          <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                            Suspendu
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            Actif
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {p.catalogId ? (
                            <Link
                              href={`/goo-admin/artistes/${p.catalogId}`}
                              className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200"
                            >
                              Détail
                            </Link>
                          ) : null}
                          <SuspendUserButton
                            userId={p.id}
                            suspended={p.is_suspended}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Certification catalogue
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Le badge bleu apparaît sur le profil public et à côté du nom dans
            Discover.
          </p>
        </div>
        <div className="overflow-hidden rounded-[24px] border border-zinc-200/70 bg-white shadow-sm shadow-zinc-900/[0.03]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Artiste</th>
                  <th className="px-5 py-3.5 font-medium">Compte propriétaire</th>
                  <th className="px-5 py-3.5 font-medium">Badge</th>
                  <th className="px-5 py-3.5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalog.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-12 text-center text-sm text-zinc-400"
                    >
                      Aucun profil catalogue trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredCatalog.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/goo-admin/artistes/${a.id}`}
                          className="group flex items-center gap-3"
                        >
                          <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-zinc-100">
                            <AppImage
                              src={a.avatar_url || FALLBACK_COVER}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="inline-flex items-center gap-1.5 font-medium text-zinc-900 group-hover:underline">
                              {a.stage_name}
                              {a.is_verified ? (
                                <VerifiedBadge size={14} />
                              ) : null}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {a.public_id}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-zinc-700">{a.ownerName}</p>
                        <p className="text-xs text-zinc-400">
                          {a.ownerEmail}
                          {a.ownerRole ? ` · ${a.ownerRole}` : ""}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        {a.is_verified ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                            <VerifiedBadge size={12} /> Certifié
                          </span>
                        ) : (
                          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
                            Non certifié
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/goo-admin/artistes/${a.id}`}
                            className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200"
                          >
                            Détail
                          </Link>
                          <VerifyArtistButton
                            artistId={a.id}
                            verified={Boolean(a.is_verified)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

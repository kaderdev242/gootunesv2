"use client";

import { AppImage } from "@/components/media/AppImage";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DeleteReleaseButton,
  HideReleaseButton,
} from "@/components/admin/AdminActionForms";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

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

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "green" | "amber" | "zinc";
}) {
  const cls =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "bg-amber-50 text-amber-800"
        : "bg-zinc-100 text-zinc-600";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

export function AdminMorceauxView({ releases }: { releases: AdminReleaseRow[] }) {
  const [tab, setTab] = useState<"album" | "single">("album");

  const filtered = useMemo(
    () => releases.filter((r) => r.type === tab),
    [releases, tab],
  );

  const albumCount = releases.filter((r) => r.type === "album").length;
  const singleCount = releases.filter((r) => r.type === "single").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <AdminPageHeader
          title="Morceaux"
          description={`${releases.length} publications · masque ou supprime si besoin`}
        />
        <div className="inline-flex rounded-2xl bg-zinc-200/70 p-1">
          <button
            type="button"
            onClick={() => setTab("album")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === "album"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Albums
            <span className="ml-2 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-500">
              {albumCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("single")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === "single"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Singles
            <span className="ml-2 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-500">
              {singleCount}
            </span>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-sm shadow-zinc-900/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs text-zinc-400">
              <tr>
                <th className="px-5 py-3.5 font-medium">Release</th>
                <th className="px-5 py-3.5 font-medium">Artiste</th>
                <th className="px-5 py-3.5 font-medium">Prix</th>
                <th className="px-5 py-3.5 font-medium">Statut</th>
                <th className="px-5 py-3.5 font-medium">Visibilité</th>
                <th className="px-5 py-3.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-zinc-400"
                  >
                    Aucun {tab === "album" ? "album" : "single"} pour le moment.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative size-11 overflow-hidden rounded-xl bg-zinc-100">
                          {r.cover_url ? (
                            <AppImage
                              src={r.cover_url}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="44px"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/discover/release/${r.publicId}`}
                            className="truncate font-medium text-zinc-900 hover:underline"
                          >
                            {r.title}
                          </Link>
                          <p className="text-xs text-zinc-400">
                            {r.genre || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-zinc-800">{r.artistName}</p>
                      <p className="text-xs text-zinc-400">{r.ownerEmail}</p>
                    </td>
                    <td className="px-5 py-3.5 tabular-nums text-zinc-700">
                      {(r.price_fcfa || 0).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone="zinc">{r.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      {r.is_hidden ? (
                        <Badge tone="amber">Masqué</Badge>
                      ) : (
                        <Badge tone="green">Visible</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <HideReleaseButton
                          releaseId={r.id}
                          hidden={r.is_hidden}
                        />
                        <DeleteReleaseButton
                          releaseId={r.id}
                          title={r.title}
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
    </div>
  );
}

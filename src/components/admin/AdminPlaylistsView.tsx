"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import { GlobeIcon, LockIcon, Playlist01Icon, UserMultipleIcon } from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { MediaModal } from "@/components/ui/MediaModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useActionToast } from "@/hooks/useActionToast";
import {
  adminDeletePlaylist,
  adminSetPlaylistPublic,
  adminUpdatePlaylist,
} from "@/lib/actions/admin";
import type { ActionState } from "@/lib/actions/profile";
import type { AdminPlaylistRow } from "@/lib/admin/queries";
import { formatCount } from "@/lib/format";
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
  consoleButtonClass,
} from "@/components/admin/console/ui";

const initial: ActionState = {};

type VisFilter = "all" | "public" | "private";

function VisibilityButton({ row }: { row: AdminPlaylistRow }) {
  const [state, action, pending] = useActionState(adminSetPlaylistPublic, initial);
  useActionToast(state);
  return (
    <form action={action}>
      <input type="hidden" name="playlist_id" value={row.id} />
      <input type="hidden" name="is_public" value={row.isPublic ? "false" : "true"} />
      <button type="submit" disabled={pending} className={consoleButtonClass(row.isPublic ? "warning" : "success", "sm")}>
        {pending ? "…" : row.isPublic ? "Rendre privée" : "Rendre publique"}
      </button>
    </form>
  );
}

function EditButton({ row }: { row: AdminPlaylistRow }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const res = await adminUpdatePlaylist(prev, fd);
    if (res.success) setOpen(false);
    return res;
  }, initial);
  useActionToast(state);

  const field =
    "w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 text-[14px] text-white outline-none focus:border-white/25";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={consoleButtonClass("ghost", "sm")}>
        Modifier
      </button>
      <MediaModal
        open={open}
        onClose={() => !pending && setOpen(false)}
        cover={row.coverUrl}
        title="Modifier la playlist"
        description={`Créée par ${row.ownerName}`}
        labelledBy={`edit-playlist-${row.id}`}
      >
        <form action={action} className="space-y-4 text-left">
          <input type="hidden" name="playlist_id" value={row.id} />
          <label className="block space-y-1.5">
            <span className="text-[13px] text-white/50">Titre</span>
            <input name="title" required maxLength={80} defaultValue={row.title} className={`${field} h-11`} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[13px] text-white/50">Description</span>
            <textarea
              name="description"
              maxLength={400}
              rows={3}
              defaultValue={row.description}
              className={`${field} resize-none py-2.5`}
            />
          </label>
          {row.coverUrl ? (
            <label className="flex items-center gap-2.5 text-[14px] text-white/80">
              <input type="checkbox" name="remove_cover" value="true" className="size-4 accent-white" />
              Retirer la pochette
            </label>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="flex h-12 w-full items-center justify-center rounded-full bg-white text-[15px] font-semibold text-black transition-[background-color,transform] duration-150 hover:bg-white/90 active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? "Un instant…" : "Enregistrer"}
          </button>
        </form>
      </MediaModal>
    </>
  );
}

function DeleteButton({ row }: { row: AdminPlaylistRow }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const res = await adminDeletePlaylist(prev, fd);
    if (res.success) setOpen(false);
    return res;
  }, initial);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={pending || isPending} className={consoleButtonClass("danger", "sm")}>
        Supprimer
      </button>
      <form ref={formRef} action={action} className="hidden">
        <input type="hidden" name="playlist_id" value={row.id} />
      </form>
      <ConfirmDialog
        isOpen={open}
        onOpenChange={setOpen}
        cover={row.coverUrl}
        title="Supprimer cette playlist ?"
        description={`« ${row.title} » de ${row.ownerName} sera supprimée pour tout le monde, avec ses ${row.tracks} titre${row.tracks > 1 ? "s" : ""}. Les morceaux eux-mêmes ne sont pas touchés. Action définitive.`}
        confirmLabel="Supprimer"
        isPending={pending || isPending}
        onConfirm={() => startTransition(() => formRef.current?.requestSubmit())}
      />
    </>
  );
}

export function AdminPlaylistsView({ playlists }: { playlists: AdminPlaylistRow[] }) {
  const [vis, setVis] = useState<VisFilter>("all");
  const [query, setQuery] = useState("");

  const publicCount = playlists.filter((p) => p.isPublic).length;
  const privateCount = playlists.length - publicCount;
  const totalSaves = playlists.reduce((acc, p) => acc + p.saves, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return playlists.filter((p) => {
      if (vis === "public" && !p.isPublic) return false;
      if (vis === "private" && p.isPublic) return false;
      if (!q) return true;
      return [p.title, p.description, p.ownerName, p.ownerEmail, p.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [playlists, query, vis]);

  return (
    <div className="space-y-5">
      <ConsoleHeader
        title="Playlists"
        description="Les playlists créées par les utilisateurs. Rends une playlist privée pour la retirer de Discover, modifie-la ou supprime-la."
      />

      <KpiGrid cols={4}>
        <Kpi highlight label="Playlists" value={formatCount(playlists.length)} icon={Playlist01Icon} />
        <Kpi label="Publiques" value={publicCount} icon={GlobeIcon} />
        <Kpi label="Privées" value={privateCount} icon={LockIcon} />
        <Kpi label="Sauvegardes" value={formatCount(totalSaves)} icon={UserMultipleIcon} />
      </KpiGrid>

      <Toolbar>
        <Segmented<VisFilter>
          value={vis}
          onChange={setVis}
          options={[
            { value: "all", label: "Toutes", count: playlists.length },
            { value: "public", label: "Publiques", count: publicCount },
            { value: "private", label: "Privées", count: privateCount },
          ]}
        />
        <ConsoleSearch value={query} onChange={setQuery} placeholder="Rechercher (titre, créateur, email…)" />
      </Toolbar>

      <Panel flush title="Playlists" subtitle={`${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`}>
        <div className={T.wrap}>
          <table className={`${T.table} min-w-[900px]`}>
            <thead className={T.thead}>
              <tr>
                <th className={T.th}>Playlist</th>
                <th className={T.th}>Créée par</th>
                <th className={`${T.th} text-right`}>Titres</th>
                <th className={`${T.th} text-right`}>Sauvegardes</th>
                <th className={T.th}>Visibilité</th>
                <th className={`${T.th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <ConsoleEmpty title="Aucune playlist pour ces filtres" />
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className={T.tr}>
                    <td className={T.td}>
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
                          {p.coverUrl ? <AppImage src={p.coverUrl} alt="" fill className="object-cover" sizes="40px" /> : null}
                        </div>
                        <div className="min-w-0">
                          {p.isPublic ? (
                            <Link href={`/discover/playlists/${p.id}`} target="_blank" className={`${T.strong} block max-w-[260px] truncate hover:text-violet-200`}>
                              {p.title}
                            </Link>
                          ) : (
                            <p className={`${T.strong} max-w-[260px] truncate`}>{p.title}</p>
                          )}
                          <p className={`${T.sub} max-w-[260px] truncate`}>
                            {p.description || `Modifiée le ${new Date(p.updatedAt).toLocaleDateString("fr-FR")}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={T.td}>
                      <p className="text-zinc-200">{p.ownerName}</p>
                      <p className={T.sub}>{p.ownerEmail}</p>
                    </td>
                    <td className={`${T.td} ${T.num} text-right`}>{p.tracks}</td>
                    <td className={`${T.td} ${T.num} text-right`}>{p.saves}</td>
                    <td className={T.td}>
                      {p.isPublic ? <Pill tone="ok">Publique</Pill> : <Pill tone="neutral">Privée</Pill>}
                    </td>
                    <td className={T.td}>
                      <div className="flex items-center justify-end gap-1.5">
                        <EditButton row={p} />
                        <VisibilityButton row={p} />
                        <DeleteButton row={p} />
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

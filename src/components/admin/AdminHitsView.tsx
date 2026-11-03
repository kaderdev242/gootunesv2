"use client";

import { AppImage } from "@/components/media/AppImage";
import { CheckmarkCircle02Icon, Edit02Icon, StarIcon } from "@hugeicons/core-free-icons";
import {
  ConsoleEmpty,
  ConsoleHeader,
  Kpi,
  KpiGrid,
  Panel,
  Pill,
  consoleButtonClass,
} from "@/components/admin/console/ui";
import { useActionState, useMemo, useState, useTransition } from "react";
import {
  addEditorialHit,
  moveEditorialHit,
  publishEditorialHits,
  removeEditorialHit,
  searchHitsCatalogAction,
  unpublishEditorialHits,
  updateEditorialHit,
} from "@/lib/actions/admin";
import type {
  AdminHitRow,
  CatalogHitCandidate,
} from "@/lib/admin/queries";
import type { ActionState } from "@/lib/actions/profile";
import { useActionToast } from "@/hooks/useActionToast";
import { uploadViaApi } from "@/lib/upload-client";
import { FALLBACK_COVER } from "@/lib/types/music";

const initial: ActionState = {};

function PublishButtons({
  hitCount,
  hasPublished,
}: {
  hitCount: number;
  hasPublished: boolean;
}) {
  const [pubState, pubAction, pubPending] = useActionState(
    publishEditorialHits,
    initial,
  );
  const [unpubState, unpubAction, unpubPending] = useActionState(
    unpublishEditorialHits,
    initial,
  );
  useActionToast(pubState);
  useActionToast(unpubState);

  return (
    <div className="flex flex-wrap gap-2">
      <form action={pubAction}>
        <button
          type="submit"
          disabled={pubPending || hitCount === 0}
          title={
            hitCount === 0
              ? "Ajoute d'abord un hit avec « Publier ce hit »"
              : undefined
          }
          className={consoleButtonClass("primary")}
        >
          {pubPending ? "Publication…" : "Publier toute la file"}
        </button>
      </form>
      {hasPublished ? (
        <form action={unpubAction}>
          <button
            type="submit"
            disabled={unpubPending}
            className={consoleButtonClass("ghost")}
          >
            {unpubPending ? "…" : "Dépublier"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function HitRowActions({ hit }: { hit: AdminHitRow }) {
  const [moveState, moveAction, movePending] = useActionState(
    moveEditorialHit,
    initial,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeEditorialHit,
    initial,
  );
  const [editState, editAction, editPending] = useActionState(
    updateEditorialHit,
    initial,
  );
  const [uploading, setUploading] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(hit.title);
  useActionToast(moveState);
  useActionToast(removeState);
  useActionToast(editState);

  async function onCoverChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const url = (await uploadViaApi(file, "cover")).fileUrl;
      const fd = new FormData();
      fd.set("hit_id", hit.id);
      fd.set("cover_url", url);
      await editAction(fd);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {editingTitle ? (
        <form
          action={editAction}
          className="flex items-center gap-1.5"
          onSubmit={() => setEditingTitle(false)}
        >
          <input type="hidden" name="hit_id" value={hit.id} />
          <input
            name="title"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            maxLength={120}
            className="w-40 rounded-lg border border-white/[0.08] bg-[#0c0c0e] px-2 py-1 text-xs text-zinc-100 outline-none focus:ring-2 focus:ring-violet-500/15"
            placeholder={hit.trackTitle}
          />
          <button
            type="submit"
            disabled={editPending}
            className={consoleButtonClass("primary", "sm")}
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => {
              setTitleValue(hit.title);
              setEditingTitle(false);
            }}
            className={consoleButtonClass("subtle", "sm")}
          >
            ✕
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditingTitle(true)}
          className={consoleButtonClass("subtle", "sm")}
        >
          Titre
        </button>
      )}
      <form action={moveAction}>
        <input type="hidden" name="hit_id" value={hit.id} />
        <input type="hidden" name="direction" value="up" />
        <button
          type="submit"
          disabled={movePending}
          className={consoleButtonClass("subtle", "sm")}
          title="Monter"
        >
          ↑
        </button>
      </form>
      <form action={moveAction}>
        <input type="hidden" name="hit_id" value={hit.id} />
        <input type="hidden" name="direction" value="down" />
        <button
          type="submit"
          disabled={movePending}
          className={consoleButtonClass("subtle", "sm")}
          title="Descendre"
        >
          ↓
        </button>
      </form>
      <label className={`cursor-pointer ${consoleButtonClass("subtle", "sm")}`}>
        {uploading || editPending ? "…" : "Cover"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onCoverChange(e.target.files?.[0] || null)}
        />
      </label>
      <form action={removeAction}>
        <input type="hidden" name="hit_id" value={hit.id} />
        <button
          type="submit"
          disabled={removePending}
          className={consoleButtonClass("danger", "sm")}
        >
          Retirer
        </button>
      </form>
    </div>
  );
}

export function AdminHitsView({
  hits,
  initialCandidates,
}: {
  hits: AdminHitRow[];
  initialCandidates: CatalogHitCandidate[];
}) {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] =
    useState<CatalogHitCandidate[]>(initialCandidates);
  const [searching, startSearch] = useTransition();
  const [selected, setSelected] = useState<CatalogHitCandidate | null>(null);
  const [hitTitle, setHitTitle] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [addState, addAction, addPending] = useActionState(
    addEditorialHit,
    initial,
  );
  useActionToast(addState);

  const publishedCount = useMemo(
    () => hits.filter((h) => h.isPublished).length,
    [hits],
  );

  function runSearch(value: string) {
    setQuery(value);
    startSearch(async () => {
      const rows = await searchHitsCatalogAction(value);
      setCandidates(rows);
    });
  }

  async function onCoverPick(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const url = (await uploadViaApi(file, "cover")).fileUrl;
      setCoverUrl(url);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <ConsoleHeader
        kicker="Éditorial"
        title="Les Hits"
        description="La sélection mise en avant dans Discover. Choisis les morceaux, l'ordre et la pochette."
        actions={<PublishButtons hitCount={hits.length} hasPublished={publishedCount > 0} />}
      />

      <KpiGrid cols={3}>
        <Kpi highlight label="Hits dans la file" value={hits.length} icon={StarIcon} />
        <Kpi label="Publiés" value={publishedCount} icon={CheckmarkCircle02Icon} />
        <Kpi label="Brouillons" value={hits.length - publishedCount} icon={Edit02Icon} />
      </KpiGrid>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
      <Panel
        title="Ajouter un hit"
        subtitle="1. Choisis un morceau · 2. Ajuste titre et pochette · 3. Publie"
      >

        <div className="mt-4">
          <input
            type="search"
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Titre, artiste, genre…"
            className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] text-zinc-100 placeholder:text-zinc-500 px-4 py-2.5 text-sm outline-none ring-violet-500/15 focus:bg-white/[0.05] focus:ring-2"
          />
        </div>

        <div className="mt-3 max-h-64 space-y-1 overflow-y-auto rounded-2xl border border-white/[0.05] bg-black/20 p-2">
          {searching ? (
            <p className="px-2 py-3 text-sm text-zinc-500">Recherche…</p>
          ) : candidates.length === 0 ? (
            <p className="px-2 py-3 text-sm text-zinc-500">Aucun résultat.</p>
          ) : (
            candidates.map((c) => (
              <button
                key={c.trackId}
                type="button"
                disabled={c.alreadyInHits}
                onClick={() => {
                  setSelected(c);
                  setCoverUrl("");
                  setHitTitle(c.title);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${
                  selected?.trackId === c.trackId
                    ? "bg-violet-500/20 text-white ring-1 ring-violet-400/30"
                    : c.alreadyInHits
                      ? "cursor-not-allowed opacity-40"
                      : "hover:bg-white/[0.04]"
                }`}
              >
                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
                  <AppImage
                    src={c.coverUrl || FALLBACK_COVER}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.title}</p>
                  <p
                    className={`truncate text-xs ${
                      selected?.trackId === c.trackId
                        ? "text-violet-200/70"
                        : "text-zinc-500"
                    }`}
                  >
                    {c.artistName}
                    {c.salesCount > 0 ? ` · ${c.salesCount} vente${c.salesCount > 1 ? "s" : ""}` : ""}
                    {c.alreadyInHits ? " · déjà ajouté" : ""}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {selected ? (
          <form action={addAction} className="mt-4 space-y-3 border-t border-white/[0.05] pt-4">
            <input type="hidden" name="track_id" value={selected.trackId} />
            <input type="hidden" name="cover_url" value={coverUrl} />
            <div className="flex flex-wrap items-start gap-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-white/[0.05] ring-1 ring-white/10">
                <AppImage
                  src={coverUrl || selected.coverUrl || FALLBACK_COVER}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <label className="text-xs font-medium text-zinc-500">
                    Titre affiché sur Discover
                  </label>
                  <input
                    name="title"
                    value={hitTitle}
                    onChange={(e) => setHitTitle(e.target.value)}
                    maxLength={120}
                    required
                    placeholder={selected.title}
                    className="mt-1 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] text-zinc-100 placeholder:text-zinc-500 px-3 py-2 text-sm outline-none focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/15"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Morceau catalogue : {selected.title} · {selected.artistName}
                  </p>
                </div>
                <label className={`cursor-pointer ${consoleButtonClass("subtle", "sm")}`}>
                  {uploading
                    ? "Envoi…"
                    : coverUrl
                      ? "Changer la cover"
                      : "Cover personnalisée (optionnel)"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      void onCoverPick(e.target.files?.[0] || null)
                    }
                  />
                </label>
              </div>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-col">
                <button
                  type="submit"
                  name="publish_now"
                  value="true"
                  disabled={addPending || uploading || !hitTitle.trim()}
                  className={consoleButtonClass("primary")}
                >
                  {addPending ? "Publication…" : "Publier ce hit"}
                </button>
                <button
                  type="submit"
                  name="publish_now"
                  value="false"
                  disabled={addPending || uploading || !hitTitle.trim()}
                  className={consoleButtonClass("ghost")}
                >
                  Brouillon seulement
                </button>
              </div>
            </div>
          </form>
        ) : null}
      </Panel>

      <Panel
        flush
        title="File d'attente"
        subtitle="Réordonne, change la pochette ou publie toute la file d'un coup."
      >
        {hits.length === 0 ? (
          <ConsoleEmpty title="Aucun hit pour l'instant" hint="Ajoute un morceau avec « Publier ce hit »." />
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {hits.map((hit, i) => (
              <li
                key={hit.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3"
              >
                <span className="w-6 text-center text-xs font-medium text-zinc-500">
                  {i + 1}
                </span>
                <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-white/[0.05]">
                  <AppImage
                    src={hit.coverUrl || hit.releaseCover || FALLBACK_COVER}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">
                    {hit.title}
                  </p>
                  <p className="truncate text-xs text-zinc-400">
                    {hit.title !== hit.trackTitle
                      ? `${hit.trackTitle} · `
                      : ""}
                    {hit.artistName}
                    {hit.salesCount > 0
                      ? ` · ${hit.salesCount} vente${hit.salesCount > 1 ? "s" : ""}`
                      : ""}
                  </p>
                </div>
                {hit.isPublished ? <Pill tone="ok" dot>Publié</Pill> : <Pill tone="warn" dot>Brouillon</Pill>}
                <HitRowActions hit={hit} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
      </div>
    </div>
  );
}

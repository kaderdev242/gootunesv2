"use client";

import Image from "next/image";
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
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
        >
          {pubPending ? "Publication…" : "Publier toute la file"}
        </button>
      </form>
      {hasPublished ? (
        <form action={unpubAction}>
          <button
            type="submit"
            disabled={unpubPending}
            className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-50"
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
      const url = await uploadViaApi(file, "cover");
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
            className="w-40 rounded-lg border border-zinc-200 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-zinc-900/10"
            placeholder={hit.trackTitle}
          />
          <button
            type="submit"
            disabled={editPending}
            className="rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white disabled:opacity-50"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => {
              setTitleValue(hit.title);
              setEditingTitle(false);
            }}
            className="rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-600"
          >
            ✕
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditingTitle(true)}
          className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
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
          className="rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200 disabled:opacity-50"
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
          className="rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200 disabled:opacity-50"
          title="Descendre"
        >
          ↓
        </button>
      </form>
      <label className="cursor-pointer rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200">
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
          className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
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
      const url = await uploadViaApi(file, "cover");
      setCoverUrl(url);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Les Hits
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Curate la section Discover · {hits.length} hit
            {hits.length > 1 ? "s" : ""} · {publishedCount} publié
            {publishedCount > 1 ? "s" : ""}
          </p>
        </div>
        <PublishButtons
          hitCount={hits.length}
          hasPublished={publishedCount > 0}
        />
      </header>

      <section className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/5">
        <h2 className="text-lg font-semibold text-zinc-900">Ajouter un hit</h2>
        <p className="mt-1 text-sm text-zinc-500">
          1. Sélectionne un morceau · 2. Ajuste le titre / cover · 3. Clique{" "}
          <span className="font-medium text-zinc-700">Publier ce hit</span>
        </p>

        <div className="mt-4">
          <input
            type="search"
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Titre, artiste, genre…"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none ring-zinc-900/10 focus:bg-white focus:ring-2"
          />
        </div>

        <div className="mt-3 max-h-64 space-y-1 overflow-y-auto rounded-2xl border border-zinc-100 bg-zinc-50/60 p-2">
          {searching ? (
            <p className="px-2 py-3 text-sm text-zinc-400">Recherche…</p>
          ) : candidates.length === 0 ? (
            <p className="px-2 py-3 text-sm text-zinc-400">Aucun résultat.</p>
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
                    ? "bg-zinc-900 text-white"
                    : c.alreadyInHits
                      ? "cursor-not-allowed opacity-40"
                      : "hover:bg-white"
                }`}
              >
                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-zinc-200">
                  <Image
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
                        ? "text-white/60"
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
          <form action={addAction} className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
            <input type="hidden" name="track_id" value={selected.trackId} />
            <input type="hidden" name="cover_url" value={coverUrl} />
            <div className="flex flex-wrap items-start gap-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-200 ring-1 ring-zinc-200">
                <Image
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
                    className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-zinc-900/10"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Morceau catalogue : {selected.title} · {selected.artistName}
                  </p>
                </div>
                <label className="inline-flex cursor-pointer rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200">
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
                  className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {addPending ? "Publication…" : "Publier ce hit"}
                </button>
                <button
                  type="submit"
                  name="publish_now"
                  value="false"
                  disabled={addPending || uploading || !hitTitle.trim()}
                  className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
                >
                  Brouillon seulement
                </button>
              </div>
            </div>
          </form>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-sm shadow-zinc-900/5">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">
            File d&apos;attente
          </h2>
          <p className="text-sm text-zinc-500">
            Hits déjà ajoutés — réordonne ou publie toute la file d&apos;un coup.
          </p>
        </div>
        {hits.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-400">
            Aucun hit pour l&apos;instant. Utilise « Publier ce hit » plus haut.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {hits.map((hit, i) => (
              <li
                key={hit.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3"
              >
                <span className="w-6 text-center text-xs font-medium text-zinc-400">
                  {i + 1}
                </span>
                <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-zinc-200">
                  <Image
                    src={hit.coverUrl || hit.releaseCover || FALLBACK_COVER}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {hit.title}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {hit.title !== hit.trackTitle
                      ? `${hit.trackTitle} · `
                      : ""}
                    {hit.artistName}
                    {hit.salesCount > 0
                      ? ` · ${hit.salesCount} vente${hit.salesCount > 1 ? "s" : ""}`
                      : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    hit.isPublished
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {hit.isPublished ? "Publié" : "Brouillon"}
                </span>
                <HitRowActions hit={hit} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

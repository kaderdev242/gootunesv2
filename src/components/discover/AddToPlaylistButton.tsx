"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Alert02Icon,
  Cancel01Icon,
  Playlist02Icon,
} from "@hugeicons/core-free-icons";
import { addTrackToPlaylist } from "@/lib/actions/playlists";
import { reportTrack } from "@/lib/actions/reports";
import type { ActionState } from "@/lib/actions/profile";
import { useActionToast } from "@/hooks/useActionToast";
import type { PlaylistSummary } from "@/lib/playlists/queries";

const initial: ActionState = {};

const REPORT_REASONS = [
  { value: "copyright", label: "Droit d'auteur / contrefaçon" },
  { value: "illegal", label: "Contenu illégal" },
  { value: "spam", label: "Spam ou contenu trompeur" },
  { value: "hate", label: "Haine / harcèlement" },
  { value: "other", label: "Autre" },
] as const;

export function AddToPlaylistButton({
  trackId,
  playlists,
  isLoggedIn,
}: {
  trackId: string;
  playlists: PlaylistSummary[];
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [state, action, pending] = useActionState(addTrackToPlaylist, initial);
  const [reportState, reportAction, reportPending] = useActionState(
    reportTrack,
    initial,
  );
  useActionToast(state);
  useActionToast(reportState);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state?.success]);

  useEffect(() => {
    if (reportState?.success) {
      setReportOpen(false);
      setOpen(false);
    }
  }, [reportState?.success]);

  if (!isLoggedIn) {
    return (
      <Link
        href={`/connexion?next=/discover`}
        className="inline-flex size-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
        aria-label="Se connecter pour ajouter à une playlist"
        title="Connecte-toi"
      >
        <HugeiconsIcon icon={Playlist02Icon} size={16} />
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setReportOpen(false);
        }}
        className="inline-flex size-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
        aria-label="Actions du morceau"
        title="Ajouter ou signaler"
      >
        <HugeiconsIcon icon={open ? Cancel01Icon : Add01Icon} size={16} />
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-white/12 bg-[#141414] shadow-2xl shadow-black/50">
          {!reportOpen ? (
            <>
              <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2.5">
                <HugeiconsIcon
                  icon={Playlist02Icon}
                  size={14}
                  className="text-white/45"
                />
                <p className="text-xs font-medium text-white/70">Ajouter à…</p>
              </div>

              {playlists.length === 0 ? (
                <div className="space-y-2 p-3">
                  <p className="text-xs text-white/40">Aucune playlist encore.</p>
                  <Link
                    href="/discover/playlists/nouveau"
                    className="inline-flex text-xs font-medium text-white underline"
                    onClick={() => setOpen(false)}
                  >
                    Créer une playlist
                  </Link>
                </div>
              ) : (
                <ul className="max-h-56 overflow-y-auto py-1">
                  {playlists.map((p) => (
                    <li key={p.id}>
                      <form action={action}>
                        <input type="hidden" name="playlist_id" value={p.id} />
                        <input type="hidden" name="track_id" value={trackId} />
                        <button
                          type="submit"
                          disabled={pending}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-white/80 transition hover:bg-white/8 disabled:opacity-50"
                        >
                          <span className="truncate font-medium">{p.title}</span>
                          <span className="ml-auto shrink-0 text-[11px] text-white/35">
                            {p.tracksCount}
                          </span>
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-0.5 border-t border-white/8 p-2">
                <Link
                  href="/discover/playlists/nouveau"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-2 py-2 text-xs text-white/55 transition hover:bg-white/5 hover:text-white"
                >
                  <HugeiconsIcon icon={Add01Icon} size={14} />
                  Nouvelle playlist
                </Link>
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs text-red-300/80 transition hover:bg-red-500/10 hover:text-red-200"
                >
                  <HugeiconsIcon icon={Alert02Icon} size={14} />
                  Signaler ce morceau
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2.5">
                <HugeiconsIcon
                  icon={Alert02Icon}
                  size={14}
                  className="text-red-300/80"
                />
                <p className="text-xs font-medium text-white/70">
                  Signaler ce morceau
                </p>
              </div>
              <form action={reportAction} className="space-y-3 p-3">
                <input type="hidden" name="track_id" value={trackId} />
                <label className="block space-y-1">
                  <span className="text-[11px] text-white/45">Motif</span>
                  <select
                    name="reason"
                    required
                    defaultValue=""
                    className="w-full rounded-xl border border-white/12 bg-black/40 px-2.5 py-2 text-sm text-white outline-none focus:border-white/30"
                  >
                    <option value="" disabled>
                      Choisir…
                    </option>
                    {REPORT_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-white/45">
                    Détails (optionnel)
                  </span>
                  <textarea
                    name="details"
                    rows={3}
                    maxLength={1000}
                    placeholder="Explique brièvement…"
                    className="w-full resize-none rounded-xl border border-white/12 bg-black/40 px-2.5 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="flex-1 rounded-xl px-3 py-2 text-xs text-white/55 transition hover:bg-white/5"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={reportPending}
                    className="flex-1 rounded-xl bg-red-500/20 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {reportPending ? "Envoi…" : "Envoyer"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { deletePlaylist } from "@/lib/actions/playlists";
import type { ActionState } from "@/lib/actions/profile";
import { useActionToast } from "@/hooks/useActionToast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const initial: ActionState = {};

export function DeletePlaylistButton({
  playlistId,
  title,
}: {
  playlistId: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deletePlaylist, initial);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state?.success]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending || isPending}
        className="inline-flex h-10 items-center rounded-full border border-white/15 px-4 text-sm text-white/70 transition hover:bg-white/5 disabled:opacity-50"
      >
        Supprimer
      </button>

      <form ref={formRef} action={action} className="hidden">
        <input type="hidden" name="playlist_id" value={playlistId} />
      </form>

      <ConfirmDialog
        isOpen={open}
        onOpenChange={setOpen}
        title="Supprimer cette playlist ?"
        description={
          title
            ? `La playlist « ${title} » et ses associations seront définitivement supprimées.`
            : "Cette playlist et ses associations seront définitivement supprimées."
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        isPending={pending || isPending}
        onConfirm={() => {
          startTransition(() => {
            formRef.current?.requestSubmit();
          });
        }}
      />
    </>
  );
}

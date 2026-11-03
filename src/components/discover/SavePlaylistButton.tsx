"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { togglePlaylistSave } from "@/lib/actions/playlists";
import type { ActionState } from "@/lib/actions/profile";
import { useActionToast } from "@/hooks/useActionToast";

const initial: ActionState = {};

export function SavePlaylistButton({
  playlistId,
  isSaved,
  savesCount,
}: {
  playlistId: string;
  isSaved: boolean;
  savesCount: number;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(togglePlaylistSave, initial);
  useActionToast(state);

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={action}>
        <input type="hidden" name="playlist_id" value={playlistId} />
        <button
          type="submit"
          disabled={pending}
          className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:opacity-50 ${
            isSaved
              ? "bg-white text-black"
              : "border border-white/20 bg-white/5 text-white hover:bg-white/10"
          }`}
        >
          <HugeiconsIcon icon={FavouriteIcon} size={16} />
          {isSaved ? "Sauvegardée" : "Sauvegarder"}
        </button>
      </form>
      <p className="text-xs text-white/45">
        {savesCount}{" "}
        {savesCount === 1 ? "sauvegarde" : "sauvegardes"}
      </p>
    </div>
  );
}

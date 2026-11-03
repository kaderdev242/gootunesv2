"use client";

import { useActionState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { removeTrackFromPlaylist } from "@/lib/actions/playlists";
import type { ActionState } from "@/lib/actions/profile";
import { useActionToast } from "@/hooks/useActionToast";
import type { Track } from "@/lib/types/music";
import { DetailTrackTable } from "./DetailTrackTable";

const initial: ActionState = {};

export function PlaylistTrackList({
  playlistId,
  tracks,
  canEdit = true,
}: {
  playlistId: string;
  tracks: Track[];
  canEdit?: boolean;
}) {
  const [state, action, pending] = useActionState(
    removeTrackFromPlaylist,
    initial,
  );
  useActionToast(state);

  return (
    <DetailTrackTable
      tracks={tracks}
      showCover
      emptyLabel="Playlist vide. Ajoute des morceaux depuis une page de sortie."
      rowActions={
        canEdit
          ? (track) => (
              <form action={action}>
                <input type="hidden" name="playlist_id" value={playlistId} />
                <input type="hidden" name="track_id" value={track.id} />
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex size-9 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                  aria-label="Retirer de la playlist"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={16} />
                </button>
              </form>
            )
          : undefined
      }
    />
  );
}

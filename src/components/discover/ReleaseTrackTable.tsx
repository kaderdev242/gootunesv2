"use client";

import type { PlaylistSummary } from "@/lib/playlists/queries";
import type { Track } from "@/lib/types/music";
import { AddToPlaylistButton } from "./AddToPlaylistButton";
import { DetailTrackTable } from "./DetailTrackTable";

export function ReleaseTrackTable({
  tracks,
  playlists,
  isLoggedIn,
}: {
  tracks: Track[];
  playlists: PlaylistSummary[];
  isLoggedIn: boolean;
}) {
  return (
    <DetailTrackTable
      tracks={tracks}
      rowActions={(track) => (
        <AddToPlaylistButton
          trackId={track.id}
          playlists={playlists}
          isLoggedIn={isLoggedIn}
        />
      )}
    />
  );
}

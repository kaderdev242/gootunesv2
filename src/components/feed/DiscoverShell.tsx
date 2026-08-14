"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { FeedSidebar } from "./FeedSidebar";
import { FeedRightPanel } from "./FeedRightPanel";
import { FeedPlayer } from "./FeedPlayer";
import { DiscoverHeader } from "./DiscoverHeader";
import { PlayerProvider } from "./PlayerProvider";
import { PendingPurchasePoller } from "@/components/discover/PendingPurchasePoller";
import { IconButton } from "@/components/ui/IconButton";
import type { Profile } from "@/lib/supabase/database.types";
import type { RecentPlay } from "@/lib/types/music";
import type { PlaylistSummary } from "@/lib/playlists/queries";

export function DiscoverShell({
  children,
  profile,
  recentPlays = [],
  recentPlaylists = [],
}: {
  children: React.ReactNode;
  profile: Profile | null;
  recentPlays?: RecentPlay[];
  recentPlaylists?: PlaylistSummary[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <PlayerProvider>
      <div className="flex h-dvh overflow-hidden bg-[#121212] text-white">
        <FeedSidebar
          open={open}
          onClose={() => setOpen(false)}
          recentPlaylists={recentPlaylists}
          isLoggedIn={!!profile}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 lg:hidden">
            <IconButton
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <HugeiconsIcon
                icon={open ? Cancel01Icon : Menu01Icon}
                size={20}
              />
            </IconButton>
            <Link href="/discover" aria-label="Accueil Discover">
              <Logo size="sm" />
            </Link>
            <span className="size-10" />
          </div>

          <DiscoverHeader profile={profile} />

          <div className="flex min-h-0 min-w-0 flex-1">
            <main className="discover-view-wash scrollbar-thin min-w-0 flex-1 overflow-y-auto px-4 pt-6 pb-36 sm:px-6 sm:pt-8 sm:pb-32 lg:px-8">
              {children}
            </main>
            <FeedRightPanel profile={profile} recentPlays={recentPlays} />
          </div>
        </div>

        <FeedPlayer />
        <PendingPurchasePoller />
      </div>
    </PlayerProvider>
  );
}

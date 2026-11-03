"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { FeedSidebar } from "./FeedSidebar";
import { FeedPlayer } from "./FeedPlayer";
import { DiscoverHeader } from "./DiscoverHeader";
import { PlayerProvider } from "./PlayerProvider";
import { PendingPurchasePoller } from "@/components/discover/PendingPurchasePoller";
import { IconButton } from "@/components/ui/IconButton";
import type { Profile } from "@/lib/supabase/database.types";
import type { PlaylistSummary } from "@/lib/playlists/queries";

export function DiscoverShell({
  children,
  profile,
  recentPlaylists = [],
}: {
  children: React.ReactNode;
  profile: Profile | null;
  recentPlaylists?: PlaylistSummary[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <PlayerProvider>
      <div className="flex h-dvh overflow-hidden bg-black text-white">
        <FeedSidebar
          open={open}
          onClose={() => setOpen(false)}
          recentPlaylists={recentPlaylists}
          isLoggedIn={!!profile}
          isFan={profile?.role === "fan"}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3 lg:hidden">
            <IconButton
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <HugeiconsIcon
                icon={open ? Cancel01Icon : Menu01Icon}
                size={20}
              />
            </IconButton>
            <Link href="/" aria-label="Accueil Gootunes">
              <Logo size="sm" />
            </Link>
            <span className="size-10" />
          </div>

          <DiscoverHeader profile={profile} />

          <div className="flex min-h-0 min-w-0 flex-1">
            <main className="scrollbar-thin min-w-0 flex-1 overflow-y-auto bg-black px-5 pt-5 pb-36 sm:px-8 sm:pt-6 sm:pb-32 lg:px-10">
              {children}
            </main>
          </div>
        </div>

        <FeedPlayer />
        <PendingPurchasePoller />
      </div>
    </PlayerProvider>
  );
}

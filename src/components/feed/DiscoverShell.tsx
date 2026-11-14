"use client";

import { useState } from "react";
import {
  Compass01Icon,
  Home01Icon,
  LibraryIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { MobileTabBar, type MobileNavItem } from "@/components/ui/MobileNav";

import { FeedSidebar } from "./FeedSidebar";
import { FeedPlayer } from "./FeedPlayer";
import { DiscoverHeader } from "./DiscoverHeader";
import { PlayerProvider } from "./PlayerProvider";
import { PendingPurchasePoller } from "@/components/discover/PendingPurchasePoller";
import type { Profile } from "@/lib/supabase/database.types";
import type { PlaylistSummary } from "@/lib/playlists/queries";

/** Onglets mobiles : l'essentiel de Discover. Le reste passe par l'avatar. */
const DISCOVER_TABS: MobileNavItem[] = [
  { href: "/", label: "Accueil", icon: Home01Icon, exact: true, alsoActive: ["/discover"] },
  { href: "/discover/recherche", label: "Recherche", icon: Search01Icon },
  { href: "/discover/decouvrir", label: "Découvrir", icon: Compass01Icon },
  { href: "/discover/bibliotheque", label: "Bibliothèque", icon: LibraryIcon },
];

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
          <DiscoverHeader profile={profile} />

          <div className="flex min-h-0 min-w-0 flex-1">
            <main className="scrollbar-thin min-w-0 flex-1 overflow-y-auto bg-black px-5 pt-5 pb-40 sm:px-8 sm:pb-44 sm:pt-6 lg:px-10 lg:pb-32">
              {children}
            </main>
          </div>
        </div>

        <FeedPlayer />
        <MobileTabBar items={DISCOVER_TABS} />
        <PendingPurchasePoller />
      </div>
    </PlayerProvider>
  );
}

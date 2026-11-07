"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  DashboardSquare01Icon,
  GridViewIcon,
  Logout01Icon,
  NewReleasesIcon,
  Playlist01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { signOut } from "@/lib/actions/auth";
import { creatorHome } from "@/lib/dashboard/paths";
import type { Profile } from "@/lib/supabase/database.types";
import { DiscoverSearchBar } from "@/components/discover/DiscoverSearchBar";
import { Logo } from "@/components/landing/Logo";
import {
  MobileAvatarButton,
  MobileSheet,
  type MobileNavItem,
} from "@/components/ui/MobileNav";

export function DiscoverHeader({ profile }: { profile: Profile | null }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();
  const nextQuery = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
  const signInHref = `/connexion${nextQuery}`;
  const signUpHref = `/inscription${nextQuery}`;

  const isCreator = profile?.role === "artist" || profile?.role === "label";

  // Pages hors onglets, accessibles depuis l'avatar (mobile).
  const sheetItems: MobileNavItem[] = [
    ...(isCreator && profile
      ? [{ href: creatorHome(profile.role), label: "Mon espace", icon: DashboardSquare01Icon }]
      : []),
    { href: "/discover/genres", label: "Genres", icon: GridViewIcon },
    { href: "/discover/nouveautes", label: "Nouveautés", icon: NewReleasesIcon },
    { href: "/discover/playlists", label: "Playlists", icon: Playlist01Icon },
    ...(profile ? [{ href: "/discover/playlists/nouveau", label: "Créer une playlist", icon: Add01Icon }] : []),
    ...(profile?.role === "fan"
      ? [{ href: "/discover/parametres", label: "Paramètres", icon: Settings02Icon }]
      : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-20 bg-black/85 px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top))] backdrop-blur-xl sm:px-8 lg:px-10">
        {/* Mobile : logo et avatar */}
        <div className="flex h-10 items-center justify-between lg:hidden">
          <Link href="/" aria-label="Accueil Gootunes">
            <Logo size="sm" />
          </Link>
          <MobileAvatarButton
            name={profile ? profile.display_name || profile.email || "Moi" : null}
            avatarUrl={profile?.avatar_url}
            onClick={() => setSheetOpen(true)}
          />
        </div>

        {/* Ordinateur : recherche et compte */}
        <div className="hidden items-center gap-3 lg:flex">
          <div className="w-full min-w-0 max-w-md flex-1">
            <DiscoverSearchBar className="w-full" compact />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {profile ? (
              isCreator ? (
                <Link
                  href={creatorHome(profile.role)}
                  className="inline-flex h-9 items-center rounded-full bg-[#1a1a1a] px-4 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Mon espace
                </Link>
              ) : (
                <form action={signOut}>
                  <Button type="submit" size="sm" className="h-9 rounded-full bg-[#1a1a1a] px-4 font-medium text-white">
                    Déconnexion
                  </Button>
                </form>
              )
            ) : (
              <>
                <Link
                  href={signInHref}
                  className="flex h-9 items-center rounded-full px-4 text-[14px] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Se connecter
                </Link>
                <Link
                  href={signUpHref}
                  className="flex h-9 items-center rounded-full bg-white px-4 text-[14px] font-semibold text-black transition-colors hover:bg-white/90"
                >
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <MobileSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        items={sheetItems}
        header={
          profile ? (
            <>
              <p className="truncate text-[16px] font-semibold text-white">{profile.display_name || "Mon compte"}</p>
              <p className="truncate text-[13px] text-white/45">{profile.email}</p>
            </>
          ) : (
            <>
              <p className="text-[16px] font-semibold text-white">Gootunes</p>
              <p className="text-[13px] text-white/45">Connecte-toi pour acheter et garder ta musique</p>
            </>
          )
        }
        footer={
          profile ? (
            <form action={signOut}>
              <button
                type="submit"
                className="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-white/75 transition-colors active:bg-white/[0.04]"
              >
                <HugeiconsIcon icon={Logout01Icon} size={20} strokeWidth={1.5} className="text-white/60" />
                Se déconnecter
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-2 px-2 pb-1">
              <Link
                href={signInHref}
                onClick={() => setSheetOpen(false)}
                className="flex h-11 items-center justify-center rounded-full bg-[#1a1a1a] text-[14px] font-medium text-white"
              >
                Se connecter
              </Link>
              <Link
                href={signUpHref}
                onClick={() => setSheetOpen(false)}
                className="flex h-11 items-center justify-center rounded-full bg-white text-[14px] font-semibold text-black"
              >
                Créer un compte
              </Link>
            </div>
          )
        }
      />

    </>
  );
}

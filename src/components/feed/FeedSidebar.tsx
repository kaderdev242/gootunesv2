"use client";

import { AppImage } from "@/components/media/AppImage";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Compass01Icon,
  GridViewIcon,
  Home01Icon,
  LibraryIcon,
  NewReleasesIcon,
  Playlist01Icon,
  Search01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { Logo } from "@/components/landing/Logo";
import { FALLBACK_COVER } from "@/lib/types/music";
import type { PlaylistSummary } from "@/lib/playlists/queries";

const menuItems = [
  {
    href: "/",
    label: "Accueil",
    icon: Home01Icon,
    exact: true,
  },
  {
    href: "/discover/recherche",
    label: "Recherche",
    icon: Search01Icon,
  },
  {
    href: "/discover/decouvrir",
    label: "Découvrir",
    icon: Compass01Icon,
  },
  {
    href: "/discover/genres",
    label: "Genres",
    icon: GridViewIcon,
  },
  {
    href: "/discover/nouveautes",
    label: "Nouveautés",
    icon: NewReleasesIcon,
  },
  {
    href: "/discover/bibliotheque",
    label: "Bibliothèque",
    icon: LibraryIcon,
  },
  {
    href: "/discover/playlists",
    label: "Playlists",
    icon: Playlist01Icon,
  },
] as const;

type FeedSidebarProps = {
  open?: boolean;
  onClose?: () => void;
  recentPlaylists?: PlaylistSummary[];
  isLoggedIn?: boolean;
  /** Paramètres Discover : réservé aux comptes fans */
  isFan?: boolean;
};

export function FeedSidebar({
  open = false,
  onClose,
  recentPlaylists = [],
  isLoggedIn = false,
  isFan = false,
}: FeedSidebarProps) {
  const pathname = usePathname();
  const settingsActive = pathname.startsWith("/discover/parametres");

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[240px] flex-col border-r border-white/[0.06] bg-black px-3 py-5 transition-transform lg:static lg:z-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link
          href="/"
          className="mb-8 flex items-center px-3"
          onClick={onClose}
          aria-label="Accueil Gootunes"
        >
          <Logo size="sm" />
        </Link>

        <p className="mb-3 px-3 text-[11px] font-semibold tracking-[0.16em] text-white/35 uppercase">
          Menu
        </p>
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const active =
              "exact" in item && item.exact
                ? pathname === item.href || pathname === "/discover"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition ${
                  active
                    ? "bg-[#1a1a1a] text-white"
                    : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={20}
                  strokeWidth={active ? 2 : 1.5}
                  className={active ? "text-white" : "text-white/70"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="mt-8 mb-3 px-3 text-[11px] font-semibold tracking-[0.16em] text-white/35 uppercase">
          Récentes
        </p>
        <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {isLoggedIn ? (
            <>
              <Link
                href="/discover/playlists/nouveau"
                onClick={onClose}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/55 transition hover:bg-white/5 hover:text-white"
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  size={18}
                  strokeWidth={1.5}
                  className="text-white/70"
                />
                Créer
              </Link>
              {recentPlaylists.length === 0 ? (
                <p className="px-3 py-2 text-xs text-white/30">
                  Aucune playlist récente
                </p>
              ) : (
                recentPlaylists.map((p) => (
                  <Link
                    key={p.id}
                    href={`/discover/playlists/${p.id}`}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition hover:bg-white/5 hover:text-white ${
                      pathname === `/discover/playlists/${p.id}`
                        ? "bg-white/15 text-white"
                        : "text-white/55"
                    }`}
                  >
                    <span className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                      <AppImage
                        src={p.cover_url || FALLBACK_COVER}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </span>
                    <span className="truncate">{p.title}</span>
                  </Link>
                ))
              )}
            </>
          ) : (
            <Link
              href="/connexion?next=/discover/playlists"
              onClick={onClose}
              className="px-3 py-2 text-xs text-white/40 transition hover:text-white/70"
            >
              Connecte-toi pour tes playlists
            </Link>
          )}
        </div>

        {isFan ? (
          <div className="mt-3 border-t border-white/[0.06] pt-3">
            <Link
              href="/discover/parametres"
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition ${
                settingsActive
                  ? "bg-[#1a1a1a] text-white"
                  : "text-white/55 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <HugeiconsIcon
                icon={Settings02Icon}
                size={20}
                strokeWidth={settingsActive ? 2 : 1.5}
                className={settingsActive ? "text-white" : "text-white/70"}
              />
              Paramètres
            </Link>
          </div>
        ) : null}
      </aside>
    </>
  );
}

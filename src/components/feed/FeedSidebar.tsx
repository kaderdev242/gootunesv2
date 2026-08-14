"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/landing/Logo";
import { FALLBACK_COVER } from "@/lib/types/music";
import type { PlaylistSummary } from "@/lib/playlists/queries";

/** Icônes Streamline Flex Line – Free (CC BY 4.0) — sidebar Discover uniquement. */
const menuItems = [
  {
    href: "/discover",
    label: "Accueil",
    icon: "/icons/discover/home.svg",
    exact: true,
  },
  {
    href: "/discover/recherche",
    label: "Recherche",
    icon: "/icons/discover/search.svg",
  },
  {
    href: "/discover/decouvrir",
    label: "Découvrir",
    icon: "/icons/discover/discover.svg",
  },
  {
    href: "/discover/genres",
    label: "Genres",
    icon: "/icons/discover/genres.svg",
  },
  {
    href: "/discover/nouveautes",
    label: "Nouveautés",
    icon: "/icons/discover/nouveautes.svg",
  },
  {
    href: "/discover/bibliotheque",
    label: "Bibliothèque",
    icon: "/icons/discover/bibliotheque.svg",
  },
  {
    href: "/discover/playlists",
    label: "Playlists",
    icon: "/icons/discover/playlists.svg",
  },
] as const;

function SidebarIcon({
  src,
  active,
  size = 20,
}: {
  src: string;
  active?: boolean;
  size?: number;
}) {
  return (
    <span
      className={`relative shrink-0 transition ${
        active ? "opacity-100" : "opacity-70"
      }`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="size-full object-contain"
        draggable={false}
      />
    </span>
  );
}

type FeedSidebarProps = {
  open?: boolean;
  onClose?: () => void;
  recentPlaylists?: PlaylistSummary[];
  isLoggedIn?: boolean;
};

export function FeedSidebar({
  open = false,
  onClose,
  recentPlaylists = [],
  isLoggedIn = false,
}: FeedSidebarProps) {
  const pathname = usePathname();

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
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[240px] flex-col border-r border-white/5 bg-[#0b0b0b] px-4 py-6 transition-transform lg:static lg:z-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link
          href="/discover"
          className="mb-8 flex items-center px-1"
          onClick={onClose}
          aria-label="Accueil Discover"
        >
          <Logo size="sm" />
        </Link>

        <p className="mb-3 px-3 text-[11px] font-semibold tracking-[0.16em] text-white/35 uppercase">
          Menu
        </p>
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const active = "exact" in item && item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                <SidebarIcon src={item.icon} active={active} />
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
                <SidebarIcon src="/icons/discover/add.svg" size={18} />
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
                      <Image
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
      </aside>
    </>
  );
}

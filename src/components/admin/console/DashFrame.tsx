"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Logout01Icon,
  Menu01Icon,
} from "@hugeicons/core-free-icons";
import { Logo } from "@/components/landing/Logo";
import { signOut } from "@/lib/actions/auth";
import {
  MobileAvatarButton,
  MobileSheet,
  MobileTabBar,
  type MobileNavItem,
} from "@/components/ui/MobileNav";

type IconType = typeof Menu01Icon;

export type DashNavItem = {
  href: string;
  label: string;
  icon: IconType;
  exact?: boolean;
  /** Compteur discret à droite (ex. signalements ouverts). */
  count?: number;
  keywords?: string;
};

export type DashNavSection = { title?: string; items: DashNavItem[] };

export function isNavActive(pathname: string, item: DashNavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/**
 * Cadre des dashboards — même structure que Discover :
 * barre latérale noire de 240 px, ligne active #1a1a1a, contenu sur fond noir.
 */
export function DashFrame({
  space,
  sections,
  user,
  sidebarFooter,
  headerLeft,
  headerRight,
  mobileTabs,
  mobileMenu,
  mobileMenuHeader,
  children,
}: {
  /** Espace affiché sous le logo : Admin, Artiste ou Label. */
  space: string;
  sections: DashNavSection[];
  user: { name: string; subtitle: string; avatarUrl?: string | null };
  sidebarFooter?: React.ReactNode;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  /** Mobile : onglets du bas (sinon menu latéral classique, ex. admin). */
  mobileTabs?: MobileNavItem[];
  /** Mobile : autres pages, ouvertes depuis l'avatar de l'en-tête. */
  mobileMenu?: MobileNavItem[];
  mobileMenuHeader?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const tabbed = Boolean(mobileTabs?.length);
  const pathname = usePathname();
  const current = sections.flatMap((s) => s.items).find((i) => isNavActive(pathname, i));

  return (
    <div className="dark flex h-dvh overflow-hidden bg-black text-white" data-theme="dark" style={{ colorScheme: "dark" }}>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[240px] flex-col border-r border-white/[0.06] bg-black px-3 py-5 transition-transform duration-300 lg:static lg:z-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-baseline gap-2 px-3">
          <Link href="/" aria-label="Accueil Gootunes" onClick={() => setOpen(false)}>
            <Logo size="sm" />
          </Link>
          <span className="text-[13px] text-white/40">{space}</span>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none]">
          {sections.map((section, idx) => (
            <div key={section.title ?? idx} className={idx > 0 ? "mt-6" : ""}>
              {section.title ? (
                <p className="mb-2 px-3 text-[12px] text-white/35">{section.title}</p>
              ) : null}
              <div className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const active = isNavActive(pathname, item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors ${
                        active ? "bg-[#1a1a1a] text-white" : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        size={20}
                        strokeWidth={active ? 2 : 1.5}
                        className={active ? "text-white" : "text-white/70"}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.count ? (
                        <span className="font-mono text-[12px] tabular-nums text-white/45">{item.count}</span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {sidebarFooter ? <div className="mt-4 border-t border-white/[0.06] pt-4">{sidebarFooter}</div> : null}

        <div className="mt-3 flex items-center gap-3 px-1">
          <Avatar className="size-9 shrink-0">
            {user.avatarUrl ? <Avatar.Image alt={user.name} src={user.avatarUrl} /> : null}
            <Avatar.Fallback>{(user.name || "G").slice(0, 1).toUpperCase()}</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-white">{user.name}</p>
            <p className="truncate text-[12px] text-white/40">{user.subtitle}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="flex size-9 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <HugeiconsIcon icon={Logout01Icon} size={18} strokeWidth={1.5} />
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[calc(64px+env(safe-area-inset-top))] shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 pt-[env(safe-area-inset-top)] sm:px-8">
          {tabbed ? (
            <Link href="/" aria-label="Accueil Gootunes" className="lg:hidden">
              <Logo size="sm" />
            </Link>
          ) : (
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/[0.06] lg:hidden"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <HugeiconsIcon icon={open ? Cancel01Icon : Menu01Icon} size={20} strokeWidth={1.5} />
            </button>
          )}
          <div className={tabbed ? "hidden min-w-0 flex-1 lg:block" : "min-w-0 flex-1"}>
            {headerLeft ?? (
              <p className="min-w-0 truncate text-[14px] text-white/45">{current?.label ?? space}</p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {headerRight}
            {tabbed ? (
              <MobileAvatarButton name={user.name} avatarUrl={user.avatarUrl} onClick={() => setSheetOpen(true)} />
            ) : null}
          </div>
        </header>

        <main
          className={`min-h-0 flex-1 overflow-y-auto px-4 pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pb-16 ${
            tabbed ? "pb-28" : "pb-16"
          }`}
        >
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>

      {tabbed ? (
        <>
          <MobileTabBar items={mobileTabs!} />
          <MobileSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            items={mobileMenu ?? []}
            header={
              mobileMenuHeader ?? (
                <>
                  <p className="truncate text-[16px] font-semibold text-white">{user.name}</p>
                  <p className="truncate text-[13px] text-white/45">{user.subtitle}</p>
                </>
              )
            }
            footer={
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-white/75 transition-colors active:bg-white/[0.04]"
                >
                  <HugeiconsIcon icon={Logout01Icon} size={20} strokeWidth={1.5} className="text-white/60" />
                  Se déconnecter
                </button>
              </form>
            }
          />
        </>
      ) : null}
    </div>
  );
}

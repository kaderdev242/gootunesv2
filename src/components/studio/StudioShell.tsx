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

type IconType = typeof Menu01Icon;

export type StudioNavItem = {
  href: string;
  label: string;
  icon: IconType;
  exact?: boolean;
  badge?: number | string;
};

export type StudioNavSection = {
  title?: string;
  items: StudioNavItem[];
};

export type StudioUser = {
  name: string;
  subtitle: string;
  avatarUrl?: string | null;
};

function isActive(pathname: string, item: StudioNavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function StudioShell({
  space,
  sections,
  user,
  sidebarFooter,
  headerExtra,
  children,
}: {
  /** Libellé affiché à côté du logo (Admin, Artiste, Label). */
  space: string;
  sections: StudioNavSection[];
  user: StudioUser;
  /** Carte en bas de la barre latérale (ex. abonnement). */
  sidebarFooter?: React.ReactNode;
  /** Éléments à droite de l'en-tête (recherche, notifications…). */
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const current =
    sections.flatMap((s) => s.items).find((i) => isActive(pathname, i))
      ?.label ?? space;

  const initial = (user.name || "G").slice(0, 1).toUpperCase();

  return (
    <div
      className="studio light flex h-dvh overflow-hidden"
      data-theme="light"
    >
      {/* Voile mobile */}
      <div
        className={`fixed inset-0 z-40 bg-zinc-950/30 backdrop-blur-[2px] transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Barre latérale */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-[var(--studio-canvas)] px-4 pb-4 pt-5 transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size="sm" variant="dark" />
          </Link>
          <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
            {space}
          </span>
        </div>

        <nav className="mt-7 flex flex-1 flex-col gap-6 overflow-y-auto pr-1">
          {sections.map((section, sIdx) => (
            <div key={section.title ?? `s-${sIdx}`} className="flex flex-col gap-0.5">
              {section.title ? (
                <p className="mb-1.5 px-3 text-[11px] font-medium text-zinc-400">
                  {section.title}
                </p>
              ) : null}
              {section.items.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] transition ${
                      active
                        ? "studio-nav-active font-semibold text-zinc-950"
                        : "text-zinc-500 hover:bg-black/[0.035] hover:text-zinc-900"
                    }`}
                  >
                    <HugeiconsIcon
                      icon={item.icon}
                      size={18}
                      className={
                        active
                          ? "text-violet-600"
                          : "text-zinc-400 group-hover:text-zinc-700"
                      }
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="min-w-6 rounded-lg bg-[var(--studio-accent)] px-1.5 py-0.5 text-center text-[11px] font-semibold text-[var(--studio-accent-ink)]">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {sidebarFooter ? <div className="mt-4">{sidebarFooter}</div> : null}

        <div className="mt-3 flex items-center gap-3 rounded-[20px] border border-black/[0.06] bg-white/70 p-2.5">
          <Avatar className="size-9 shrink-0">
            {user.avatarUrl ? (
              <Avatar.Image alt={user.name} src={user.avatarUrl} />
            ) : null}
            <Avatar.Fallback>{initial}</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-zinc-900">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-zinc-500">{user.subtitle}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="flex size-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <HugeiconsIcon icon={Logout01Icon} size={16} />
            </button>
          </form>
        </div>
      </aside>

      {/* Zone principale */}
      <div className="flex min-w-0 flex-1 flex-col lg:py-3 lg:pr-3">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f7f7f5] lg:rounded-[32px] lg:border lg:border-black/[0.05]">
          <header className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8 lg:pt-5">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full border border-black/[0.07] bg-white text-zinc-700 lg:hidden"
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
            >
              <HugeiconsIcon icon={open ? Cancel01Icon : Menu01Icon} size={18} />
            </button>
            <p className="min-w-0 truncate text-sm font-medium text-zinc-500">
              <span className="hidden sm:inline">{space} / </span>
              <span className="text-zinc-900">{current}</span>
            </p>
            <div className="ml-auto flex items-center gap-2">{headerExtra}</div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-2 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1240px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

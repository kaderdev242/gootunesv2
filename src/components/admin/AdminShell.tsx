"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  AnalyticsUpIcon,
  Cancel01Icon,
  Folder01Icon,
  Menu01Icon,
  Money01Icon,
  MusicNote01Icon,
  Settings01Icon,
  UserMultipleIcon,
  ChartHistogramIcon,
} from "@hugeicons/core-free-icons";
import { Logo } from "@/components/landing/Logo";
import { signOut } from "@/lib/actions/auth";
import type { Profile } from "@/lib/supabase/database.types";

const NAV = [
  { href: "/goo-admin", label: "Vue d'ensemble", icon: ChartHistogramIcon, exact: true },
  { href: "/goo-admin/artistes", label: "Artistes", icon: UserMultipleIcon },
  { href: "/goo-admin/fans", label: "Fans", icon: UserMultipleIcon },
  { href: "/goo-admin/morceaux", label: "Morceaux", icon: Folder01Icon },
  { href: "/goo-admin/hits", label: "Les Hits", icon: MusicNote01Icon },
  { href: "/goo-admin/transactions", label: "Transactions", icon: Money01Icon },
  { href: "/goo-admin/signalements", label: "Signalements", icon: Alert02Icon },
  { href: "/goo-admin/stats", label: "Stats", icon: AnalyticsUpIcon },
  { href: "/goo-admin/maintenance", label: "Maintenance", icon: Settings01Icon },
];

export function AdminShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className="light flex h-dvh overflow-hidden bg-[#f3f3f5] text-zinc-900"
      data-theme="light"
      style={{ colorScheme: "light" }}
    >
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-zinc-200/80 bg-[#ececee] transition lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <Logo size="sm" variant="dark" />
          <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            Admin
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-white font-medium text-zinc-900 shadow-sm shadow-zinc-900/5"
                    : "text-zinc-500 hover:bg-white/60 hover:text-zinc-900"
                }`}
              >
                <HugeiconsIcon icon={item.icon} size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200/80 p-4">
          <p className="truncate text-xs font-medium text-zinc-700">
            {profile.display_name || profile.email}
          </p>
          <p className="truncate text-[11px] text-zinc-400">{profile.email}</p>
          <form action={signOut} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-xl px-3 py-2 text-left text-xs text-zinc-500 transition hover:bg-white hover:text-zinc-900"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-zinc-200/80 bg-[#f3f3f5] px-4 py-3 lg:hidden">
          <Button
            isIconOnly
            variant="ghost"
            className="text-zinc-800"
            aria-label="Menu"
            onPress={() => setOpen((v) => !v)}
          >
            <HugeiconsIcon icon={open ? Cancel01Icon : Menu01Icon} size={20} />
          </Button>
          <span className="text-sm font-semibold tracking-wide">Admin</span>
          <span className="size-10" />
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

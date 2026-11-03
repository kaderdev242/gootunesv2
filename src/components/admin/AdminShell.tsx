"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Button } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  AnalyticsUpIcon,
  Cancel01Icon,
  File01Icon,
  Folder01Icon,
  Logout01Icon,
  Menu01Icon,
  Money01Icon,
  MusicNote01Icon,
  Notification03Icon,
  Search01Icon,
  Settings01Icon,
  UserMultipleIcon,
  ChartHistogramIcon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons";
import { Logo } from "@/components/landing/Logo";
import { signOut } from "@/lib/actions/auth";
import type { Profile } from "@/lib/supabase/database.types";

type NavItem = {
  href: string;
  label: string;
  icon: typeof ChartHistogramIcon;
  exact?: boolean;
  badge?: number;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Plateforme",
    items: [
      {
        href: "/goo-admin",
        label: "Vue d'ensemble",
        icon: ChartHistogramIcon,
        exact: true,
      },
      { href: "/goo-admin/stats", label: "Statistiques", icon: AnalyticsUpIcon },
      {
        href: "/goo-admin/signalements",
        label: "Signalements",
        icon: Alert02Icon,
      },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/goo-admin/artistes", label: "Artistes", icon: UserMultipleIcon },
      { href: "/goo-admin/fans", label: "Fans", icon: UserMultipleIcon },
      { href: "/goo-admin/morceaux", label: "Morceaux", icon: Folder01Icon },
      { href: "/goo-admin/hits", label: "Les Hits", icon: MusicNote01Icon },
    ],
  },
  {
    title: "Finances",
    items: [
      {
        href: "/goo-admin/transactions",
        label: "Transactions",
        icon: Money01Icon,
      },
      {
        href: "/goo-admin/abonnements",
        label: "Abonnements",
        icon: CreditCardIcon,
      },
    ],
  },
  {
    title: "Système",
    items: [
      { href: "/goo-admin/logs", label: "Logs", icon: File01Icon },
      {
        href: "/goo-admin/maintenance",
        label: "Maintenance",
        icon: Settings01Icon,
      },
    ],
  },
];

const SEARCH_TARGETS: { href: string; label: string; keywords: string }[] = [
  { href: "/goo-admin", label: "Vue d'ensemble", keywords: "dashboard overview" },
  { href: "/goo-admin/artistes", label: "Artistes", keywords: "créateurs labels" },
  { href: "/goo-admin/fans", label: "Fans", keywords: "utilisateurs" },
  { href: "/goo-admin/morceaux", label: "Morceaux", keywords: "releases catalogue" },
  { href: "/goo-admin/hits", label: "Les Hits", keywords: "tendances" },
  {
    href: "/goo-admin/transactions",
    label: "Transactions",
    keywords: "paiements retraits achats",
  },
  {
    href: "/goo-admin/abonnements",
    label: "Abonnements",
    keywords: "plans pro label revenus",
  },
  {
    href: "/goo-admin/signalements",
    label: "Signalements",
    keywords: "reports modération",
  },
  { href: "/goo-admin/stats", label: "Statistiques", keywords: "analytics" },
  { href: "/goo-admin/logs", label: "Logs système", keywords: "erreurs" },
  {
    href: "/goo-admin/maintenance",
    label: "Maintenance",
    keywords: "mode maintenance",
  },
];

export function AdminShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return SEARCH_TARGETS.filter((t) =>
      `${t.label} ${t.keywords}`.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [query]);

  const pageTitle =
    SEARCH_TARGETS.find((t) =>
      t.href === "/goo-admin" ? pathname === t.href : pathname.startsWith(t.href),
    )?.label || "Admin";

  return (
    <div
      className="light flex h-dvh overflow-hidden bg-[#f4f5f7] text-zinc-900"
      data-theme="light"
      style={{ colorScheme: "light" }}
    >
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-zinc-200/70 bg-white transition lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <Logo size="sm" variant="dark" />
          <span className="rounded-md bg-[#5b8def]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#3b6fd4]">
            Admin
          </span>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] transition ${
                        active
                          ? "bg-[#eef3ff] font-semibold text-[#3b6fd4]"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        size={16}
                        className={active ? "text-[#5b8def]" : "text-zinc-400"}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-[#5b8def] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-zinc-100 p-3">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-zinc-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <HugeiconsIcon icon={Logout01Icon} size={16} />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/25 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-zinc-200/70 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
          <Button
            isIconOnly
            variant="ghost"
            className="text-zinc-700 lg:hidden"
            aria-label="Menu"
            onPress={() => setOpen((v) => !v)}
          >
            <HugeiconsIcon icon={open ? Cancel01Icon : Menu01Icon} size={20} />
          </Button>

          <div className="relative hidden min-w-0 flex-1 md:block">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchHits[0]) {
                  router.push(searchHits[0].href);
                  setQuery("");
                }
              }}
              placeholder="Rechercher une page…"
              className="w-full max-w-xl rounded-2xl border border-zinc-200/80 bg-[#f4f5f7] py-2.5 pl-10 pr-4 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-[#5b8def]/40 focus:bg-white focus:ring-2 focus:ring-[#5b8def]/15"
            />
            {searchHits.length > 0 ? (
              <div className="absolute left-0 top-full z-30 mt-1.5 w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg shadow-zinc-900/10">
                {searchHits.map((hit) => (
                  <button
                    key={hit.href}
                    type="button"
                    onClick={() => {
                      router.push(hit.href);
                      setQuery("");
                    }}
                    className="flex w-full items-center px-4 py-2.5 text-left text-sm text-zinc-700 transition hover:bg-[#eef3ff] hover:text-[#3b6fd4]"
                  >
                    {hit.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-800 md:hidden">
            {pageTitle}
          </p>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              href="/goo-admin/signalements"
              className="hidden size-10 items-center justify-center rounded-full border border-zinc-200/80 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-800 sm:flex"
              aria-label="Signalements"
            >
              <HugeiconsIcon icon={Notification03Icon} size={18} />
            </Link>
            <div className="flex items-center gap-2.5 rounded-full border border-zinc-200/80 bg-white py-1 pl-1 pr-3">
              <Avatar className="size-8">
                {profile.avatar_url ? (
                  <Avatar.Image
                    alt={profile.display_name || "Admin"}
                    src={profile.avatar_url}
                  />
                ) : null}
                <Avatar.Fallback>
                  {(profile.display_name || profile.email || "A")
                    .slice(0, 1)
                    .toUpperCase()}
                </Avatar.Fallback>
              </Avatar>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-xs font-semibold text-zinc-800">
                  {profile.display_name || "Admin"}
                </p>
                <p className="truncate text-[10px] text-zinc-400">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

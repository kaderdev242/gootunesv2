"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  AnalyticsUpIcon,
  ArrowUpRight01Icon,
  Cancel01Icon,
  ChartHistogramIcon,
  CreditCardIcon,
  File01Icon,
  Folder01Icon,
  Logout01Icon,
  Menu01Icon,
  Money01Icon,
  MusicNote01Icon,
  Search01Icon,
  Settings01Icon,
  UserIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { Logo } from "@/components/landing/Logo";
import { signOut } from "@/lib/actions/auth";
import type { Profile } from "@/lib/supabase/database.types";

type IconType = typeof ChartHistogramIcon;

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
  exact?: boolean;
  keywords?: string;
  badge?: { value: number; tone: "red" | "amber" };
};

type NavSection = { title: string; items: NavItem[] };

export type AdminCounts = {
  openReports: number;
  pendingWithdrawals: number;
  maintenance: boolean;
};

function buildNav(counts: AdminCounts): NavSection[] {
  return [
    {
      title: "Pilotage",
      items: [
        { href: "/goo-admin", label: "Vue d'ensemble", icon: ChartHistogramIcon, exact: true, keywords: "dashboard accueil" },
        { href: "/goo-admin/stats", label: "Statistiques", icon: AnalyticsUpIcon, keywords: "analytics audience" },
        {
          href: "/goo-admin/signalements",
          label: "Signalements",
          icon: Alert02Icon,
          keywords: "reports modération",
          badge: counts.openReports ? { value: counts.openReports, tone: "red" } : undefined,
        },
      ],
    },
    {
      title: "Communauté",
      items: [
        { href: "/goo-admin/artistes", label: "Artistes & labels", icon: UserMultipleIcon, keywords: "créateurs certification" },
        { href: "/goo-admin/fans", label: "Fans", icon: UserIcon, keywords: "utilisateurs comptes" },
      ],
    },
    {
      title: "Catalogue",
      items: [
        { href: "/goo-admin/morceaux", label: "Morceaux", icon: Folder01Icon, keywords: "releases sorties albums singles" },
        { href: "/goo-admin/hits", label: "Les Hits", icon: MusicNote01Icon, keywords: "éditorial tendances" },
      ],
    },
    {
      title: "Finances",
      items: [
        {
          href: "/goo-admin/transactions",
          label: "Transactions",
          icon: Money01Icon,
          keywords: "paiements retraits achats",
          badge: counts.pendingWithdrawals ? { value: counts.pendingWithdrawals, tone: "amber" } : undefined,
        },
        { href: "/goo-admin/abonnements", label: "Abonnements", icon: CreditCardIcon, keywords: "plans pro label" },
      ],
    },
    {
      title: "Système",
      items: [
        { href: "/goo-admin/logs", label: "Logs", icon: File01Icon, keywords: "erreurs système" },
        { href: "/goo-admin/maintenance", label: "Maintenance", icon: Settings01Icon, keywords: "mode maintenance" },
      ],
    },
  ];
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/* ─────────── Palette de commandes (⌘K) ─────────── */

function CommandPalette({
  items,
  open,
  onClose,
}: {
  items: NavItem[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => `${i.label} ${i.keywords ?? ""}`.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const go = (item: NavItem | undefined) => {
    if (!item) return;
    router.push(item.href);
    setQuery("");
    setIndex(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/60 px-4 pt-[14vh] backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#121214] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
          <HugeiconsIcon icon={Search01Icon} size={16} className="text-zinc-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                go(results[index]);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Aller à une page…"
            className="h-12 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-500">Échap</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-zinc-500">Aucun résultat</li>
          ) : (
            results.map((item, i) => (
              <li key={item.href}>
                <button
                  type="button"
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => go(item)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                    i === index ? "bg-violet-500/15 text-white" : "text-zinc-300"
                  }`}
                >
                  <HugeiconsIcon icon={item.icon} size={16} className={i === index ? "text-violet-300" : "text-zinc-500"} />
                  {item.label}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

/* ─────────── Coquille ─────────── */

export function AdminShell({
  profile,
  counts = { openReports: 0, pendingWithdrawals: 0, maintenance: false },
  children,
}: {
  profile: Profile;
  counts?: AdminCounts;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const pathname = usePathname();
  const sections = useMemo(() => buildNav(counts), [counts]);
  const allItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const current = allItems.find((i) => isActive(pathname, i));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div
      className="dark flex h-dvh overflow-hidden bg-[#09090b] text-zinc-200"
      data-theme="dark"
      style={{ colorScheme: "dark" }}
    >
      <CommandPalette items={allItems} open={palette} onClose={() => setPalette(false)} />

      {open ? (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />
      ) : null}

      {/* ── Barre latérale ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-white/[0.06] bg-[#0c0c0e] transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 pb-3 pt-5">
          <Link href="/goo-admin" className="flex items-center" onClick={() => setOpen(false)}>
            <Logo size="sm" variant="light" />
          </Link>
          <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-200 ring-1 ring-violet-400/25">
            Console
          </span>
        </div>

        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => setPalette(true)}
            className="flex h-9 w-full items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 text-[13px] text-zinc-500 transition hover:border-white/15 hover:text-zinc-300"
          >
            <HugeiconsIcon icon={Search01Icon} size={14} />
            <span className="flex-1 text-left">Rechercher…</span>
            <kbd className="rounded border border-white/10 px-1 text-[10px]">⌘K</kbd>
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2 [scrollbar-width:none]">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                {section.title}
              </p>
              <div className="space-y-px">
                {section.items.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition ${
                        active
                          ? "bg-white/[0.06] font-medium text-white"
                          : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-100"
                      }`}
                    >
                      {active ? (
                        <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
                      ) : null}
                      <HugeiconsIcon
                        icon={item.icon}
                        size={16}
                        className={active ? "text-violet-300" : "text-zinc-500 group-hover:text-zinc-300"}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <span
                          className={`min-w-5 rounded-md px-1.5 text-center text-[10px] font-semibold tabular-nums leading-5 ${
                            item.badge.tone === "red"
                              ? "bg-red-500/15 text-red-300"
                              : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {item.badge.value}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/[0.06] p-3">
          <Link
            href="/goo-admin/maintenance"
            className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] px-3 py-2 text-[12px] transition hover:bg-white/[0.06]"
          >
            <span className="relative flex size-2">
              <span
                className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${
                  counts.maintenance ? "bg-amber-400" : "bg-emerald-400"
                }`}
              />
              <span className={`relative inline-flex size-2 rounded-full ${counts.maintenance ? "bg-amber-400" : "bg-emerald-400"}`} />
            </span>
            <span className="flex-1 text-zinc-300">
              {counts.maintenance ? "Maintenance active" : "Site en ligne"}
            </span>
          </Link>
          <div className="flex items-center gap-2.5 px-1">
            <Avatar className="size-8 shrink-0">
              {profile.avatar_url ? <Avatar.Image alt="" src={profile.avatar_url} /> : null}
              <Avatar.Fallback>{(profile.display_name || "A").slice(0, 1).toUpperCase()}</Avatar.Fallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-zinc-100">{profile.display_name || "Admin"}</p>
              <p className="truncate text-[11px] text-zinc-500">Super admin</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Se déconnecter"
                title="Se déconnecter"
                className="flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-red-500/10 hover:text-red-300"
              >
                <HugeiconsIcon icon={Logout01Icon} size={15} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Contenu ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#09090b]/80 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-lg border border-white/[0.07] text-zinc-300 lg:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <HugeiconsIcon icon={open ? Cancel01Icon : Menu01Icon} size={17} />
          </button>
          <p className="min-w-0 truncate text-[13px] text-zinc-500">
            <span className="hidden sm:inline">Console / </span>
            <span className="font-medium text-zinc-100">{current?.label ?? "Admin"}</span>
          </p>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-md border border-white/[0.06] px-2.5 py-1 text-[12px] capitalize text-zinc-400 md:inline">
              {today}
            </span>
            <button
              type="button"
              onClick={() => setPalette(true)}
              className="flex size-9 items-center justify-center rounded-lg border border-white/[0.07] text-zinc-400 transition hover:text-white md:hidden"
              aria-label="Rechercher"
            >
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </button>
            <Link
              href="/"
              target="_blank"
              className="hidden h-9 items-center gap-1.5 rounded-lg border border-white/[0.07] px-3 text-[12px] font-medium text-zinc-300 transition hover:text-white sm:flex"
            >
              Voir le site
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} />
            </Link>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1320px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  AnalyticsUpIcon,
  ArrowUpRight01Icon,
  ChartHistogramIcon,
  CreditCardIcon,
  File01Icon,
  Folder01Icon,
  Money01Icon,
  MusicNote01Icon,
  Search01Icon,
  Settings01Icon,
  UserIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import {
  DashFrame,
  type DashNavItem,
  type DashNavSection,
} from "@/components/admin/console/DashFrame";
import type { Profile } from "@/lib/supabase/database.types";

export type AdminCounts = {
  openReports: number;
  pendingWithdrawals: number;
  maintenance: boolean;
};

function buildNav(counts: AdminCounts): DashNavSection[] {
  return [
    {
      items: [
        { href: "/goo-admin", label: "Vue d'ensemble", icon: ChartHistogramIcon, exact: true, keywords: "dashboard accueil" },
        { href: "/goo-admin/stats", label: "Statistiques", icon: AnalyticsUpIcon, keywords: "analytics audience" },
        { href: "/goo-admin/signalements", label: "Signalements", icon: Alert02Icon, count: counts.openReports, keywords: "reports modération" },
      ],
    },
    {
      title: "Communauté",
      items: [
        { href: "/goo-admin/artistes", label: "Artistes et labels", icon: UserMultipleIcon, keywords: "créateurs certification" },
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
        { href: "/goo-admin/transactions", label: "Transactions", icon: Money01Icon, count: counts.pendingWithdrawals, keywords: "paiements retraits achats" },
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

/* ─────────── Recherche rapide (⌘K) ─────────── */

function CommandPalette({ items, open, onClose }: { items: DashNavItem[]; open: boolean; onClose: () => void }) {
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

  const go = (item: DashNavItem | undefined) => {
    if (!item) return;
    router.push(item.href);
    setQuery("");
    setIndex(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/70 px-4 pt-[14vh]" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121212]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
          <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.5} className="text-white/40" />
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
            placeholder="Aller à une page"
            className="h-12 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/35"
          />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/40">Échap</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-[14px] text-white/40">Aucun résultat</li>
          ) : (
            results.map((item, i) => (
              <li key={item.href}>
                <button
                  type="button"
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => go(item)}
                  className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] transition-colors ${
                    i === index ? "bg-[#1a1a1a] text-white" : "text-white/60"
                  }`}
                >
                  <HugeiconsIcon icon={item.icon} size={18} strokeWidth={1.5} className="text-white/60" />
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

export function AdminShell({
  profile,
  counts = { openReports: 0, pendingWithdrawals: 0, maintenance: false },
  children,
}: {
  profile: Profile;
  counts?: AdminCounts;
  children: React.ReactNode;
}) {
  const [palette, setPalette] = useState(false);
  const sections = useMemo(() => buildNav(counts), [counts]);
  const allItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);

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

  return (
    <>
      <CommandPalette items={allItems} open={palette} onClose={() => setPalette(false)} />
      <DashFrame
        space="Admin"
        sections={sections}
        user={{ name: profile.display_name || "Admin", subtitle: "Administrateur", avatarUrl: profile.avatar_url }}
        sidebarFooter={
          <Link
            href="/goo-admin/maintenance"
            className="flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] text-white/60 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <span className={`size-2 rounded-full ${counts.maintenance ? "bg-amber-400" : "bg-emerald-400"}`} />
            {counts.maintenance ? "Maintenance active" : "Site en ligne"}
          </Link>
        }
        headerLeft={
          <button
            type="button"
            onClick={() => setPalette(true)}
            className="flex h-10 w-full max-w-[420px] items-center gap-3 rounded-full border border-white/[0.06] bg-[#1a1a1a] px-4 text-[14px] text-white/40 transition-colors hover:text-white/60"
          >
            <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.5} />
            <span className="flex-1 text-left">Rechercher une page</span>
            <kbd className="hidden rounded border border-white/10 px-1.5 font-mono text-[11px] sm:inline">⌘K</kbd>
          </button>
        }
        headerRight={
          <Link
            href="/"
            target="_blank"
            className="hidden h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white sm:flex"
          >
            Voir le site
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} strokeWidth={1.5} />
          </Link>
        }
      >
        {children}
      </DashFrame>
    </>
  );
}
